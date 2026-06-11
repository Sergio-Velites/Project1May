import { BattleStatus, PokemonEncounterType } from "../state/state-types";
import { GEN2_SPECIES_DATA } from "./gen2-species-data";
import { Gender, areOppositeGenders } from "./gender-helper";
import { ItemType } from "./use-item-data";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

// Fórmula auténtica de captura de Generación I (Pokémon Rojo/Azul/Amarillo).
// Referencia: https://bulbapedia.bulbagarden.net/wiki/Catch_rate/Generation_I
// y desensamblado de Pokered (engine/items/pokeball.asm).
//
// Algoritmo:
// 1. Master Ball → captura garantizada.
// 2. Según la ball:
//      ballMax  (rango RNG):  PokéBall=255, GreatBall=200, UltraBall=150
//      ballDiv  (factor HP):  PokéBall=12,  GreatBall=8,   UltraBall=12
//    (En Gen I la Ultra Ball usa ballDiv=12 igual que la PokéBall, no 8.
//     Su ventaja real es el ballMax menor — el rango RNG es más estrecho,
//     por lo que la probabilidad de pasar el chequeo de catch_rate sube.)
// 3. statusBonus según estado del rival:
//      sleep/freeze: 25
//      poison/badly-poisoned/burn/paralysis: 12
//      sin estado: 0
// 4. N = randInt(0, ballMax) inclusive.
//    Si N < statusBonus → captura instantánea (el estado solo te puede dar la captura).
// 5. N -= statusBonus. Si N > baseCatchRate → fallo.
// 6. f = clamp(floor((HPmax * 255 * 4) / (HPcurrent * ballDiv)), 1, 255).
// 7. M = randInt(0, 255). Si M <= f → captura. Si no, fallo.

interface BallParams {
  max: number; // rango RNG inclusive [0..max]
  div: number; // divisor para el factor HP
}

const ballParams: Partial<Record<ItemType, BallParams>> = {
  [ItemType.PokeBall]: { max: 255, div: 12 },
  [ItemType.GreatBall]: { max: 200, div: 8 },
  [ItemType.UltraBall]: { max: 150, div: 12 },
  // Balls de Kurt (Gen II): chasis de Poké Ball normal. Su ventaja se aplica
  // como modificador sobre el catch rate base (ver kurtBallCatchRate).
  [ItemType.FastBall]: { max: 255, div: 12 },
  [ItemType.FriendBall]: { max: 255, div: 12 },
  [ItemType.HeavyBall]: { max: 255, div: 12 },
  [ItemType.LevelBall]: { max: 255, div: 12 },
  [ItemType.LoveBall]: { max: 255, div: 12 },
  [ItemType.LureBall]: { max: 255, div: 12 },
  [ItemType.MoonBall]: { max: 255, div: 12 },
};

/** Contexto adicional para los modificadores de las balls de Kurt. */
export interface CatchContext {
  /** Nivel del Pokémon activo del jugador (Nivel Ball). */
  playerLevel?: number;
  /** Especie del Pokémon activo del jugador (Amor Ball). */
  activeSpeciesId?: number;
  /** Género del Pokémon activo del jugador (Amor Ball). */
  activeGender?: Gender;
  /** ¿El encuentro empezó pescando? (Cebo Ball). */
  fromFishing?: boolean;
}

/** Especies que evolucionan con Piedra Lunar (Luna Ball ×4). */
const MOON_STONE_EVOLVERS = new Set([30, 33, 35, 39]);

// Modificadores de las balls de Kurt sobre el catch rate base, con el
// comportamiento PREVISTO en Gen II (el original tenía varias balls rotas:
// la Luna Ball comprobaba BURN_HEAL, la Amor Ball comparaba el género
// equivocado y la Veloz Ball solo cubría 3 especies — aquí van corregidas).
const kurtBallCatchRate = (
  ball: ItemType,
  pokemon: PokemonEncounterType,
  baseCatchRate: number,
  ctx?: CatchContext
): number => {
  const clamp = (rate: number) => Math.max(1, Math.min(255, Math.floor(rate)));
  switch (ball) {
    case ItemType.FastBall:
      // Pensada para Pokémon huidizos; criterio corregido: velocidad base ≥ 100
      return getPokemonMetadata(pokemon.id).baseStats.speed >= 100
        ? clamp(baseCatchRate * 4)
        : baseCatchRate;
    case ItemType.LevelBall: {
      const lv = ctx?.playerLevel ?? 0;
      if (lv >= pokemon.level * 4) return clamp(baseCatchRate * 8);
      if (lv >= pokemon.level * 2) return clamp(baseCatchRate * 4);
      if (lv > pokemon.level) return clamp(baseCatchRate * 2);
      return baseCatchRate;
    }
    case ItemType.LoveBall: {
      // Misma especie y géneros opuestos → ×8
      const wildGender = pokemon.gender;
      return ctx?.activeSpeciesId === pokemon.id &&
        areOppositeGenders(ctx?.activeGender, wildGender)
        ? clamp(baseCatchRate * 8)
        : baseCatchRate;
    }
    case ItemType.LureBall:
      return ctx?.fromFishing ? clamp(baseCatchRate * 3) : baseCatchRate;
    case ItemType.MoonBall:
      return MOON_STONE_EVOLVERS.has(pokemon.id)
        ? clamp(baseCatchRate * 4)
        : baseCatchRate;
    case ItemType.HeavyBall: {
      // Modificador aditivo por peso (hectogramos): ≥409.6kg +40 · ≥307.2kg +30
      // · ≥204.8kg +20 · más ligero −20 (tabla de Gen II)
      const weight = GEN2_SPECIES_DATA[pokemon.id]?.weight ?? 0;
      const delta =
        weight >= 4096 ? 40 : weight >= 3072 ? 30 : weight >= 2048 ? 20 : -20;
      return clamp(baseCatchRate + delta);
    }
    // FriendBall: captura como una Poké Ball; su efecto (amistad 200) se
    // aplica tras la captura en PokemonEncounter.
    default:
      return baseCatchRate;
  }
};

const statusBonusFor = (status: BattleStatus | null | undefined): number => {
  if (!status) return 0;
  if (status.type === "sleep" || status.type === "freeze") return 25;
  // poison, badly-poisoned, burn, paralysis
  return 12;
};

// randInt(0, n) inclusive en ambos extremos
const randInt = (n: number): number => Math.floor(Math.random() * (n + 1));

const catchesPokemon = (
  pokemon: PokemonEncounterType,
  pokeball: ItemType,
  enemyStatus: BattleStatus | null | undefined = null,
  ctx?: CatchContext
): boolean => {
  if (pokeball === ItemType.MasterBall) return true;

  const params = ballParams[pokeball];
  if (!params) return false;

  const baseCatchRate = kurtBallCatchRate(
    pokeball,
    pokemon,
    getPokemonMetadata(pokemon.id).baseCatchRate,
    ctx
  );
  const statusBonus = statusBonusFor(enemyStatus);

  // Paso 4: N en [0, ballMax]
  let N = randInt(params.max);

  // Si N cae por debajo del bonus de estado, captura instantánea.
  if (N < statusBonus) return true;

  // Paso 5: restar bonus de estado y comparar con catch rate
  N -= statusBonus;
  if (N > baseCatchRate) return false;

  // Paso 6: factor HP
  const maxHp = Math.max(1, getPokemonStats(pokemon.id, pokemon.level).hp);
  const currentHp = Math.max(1, pokemon.hp);
  const f = Math.min(
    255,
    Math.max(1, Math.floor((maxHp * 255 * 4) / (currentHp * params.div)))
  );

  // Paso 7: chequeo final f vs M
  const M = randInt(255);
  return M <= f;
};

export default catchesPokemon;
