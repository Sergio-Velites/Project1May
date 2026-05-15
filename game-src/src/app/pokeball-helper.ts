import { BattleStatus, PokemonEncounterType } from "../state/state-types";
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
  enemyStatus: BattleStatus | null | undefined = null
): boolean => {
  if (pokeball === ItemType.MasterBall) return true;

  const params = ballParams[pokeball];
  if (!params) return false;

  const baseCatchRate = getPokemonMetadata(pokemon.id).baseCatchRate;
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
