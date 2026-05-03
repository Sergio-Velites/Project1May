import { PokemonEncounterType } from "../state/state-types";
import { ItemType } from "./use-item-data";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

// Gen I catch rate formula — based on Bulbapedia:
// https://bulbapedia.bulbagarden.net/wiki/Catch_rate/Generation_I
//
// Steps:
// 1. HP factor f = clamp(maxHp * 255 * 4 / (currentHp * ballDivisor), 1, 255)
//    ballDivisor: GreatBall/UltraBall = 8, PokéBall = 12
// 2. Modified catch rate a = clamp(f * baseCatchRate / 255, 1, 255)
// 3. Ball modifier applied: r = a * ballBonus / 255
//    ballBonus: MasterBall = guaranteed, UltraBall = 2.0, GreatBall = 1.5, PokéBall = 1.0
// 4. If r >= 255 → auto-catch; else probability = (r / 255) ^ (1/4) (4 shake checks)

// Ball divisor for HP factor (lower divisor = higher HP factor = better)
const ballDivisors: Partial<Record<ItemType, number>> = {
  [ItemType.PokeBall]: 12,
  [ItemType.GreatBall]: 8,
  [ItemType.UltraBall]: 8,
};

// Ball bonus multiplier (higher = better catch rate)
const ballBonuses: Partial<Record<ItemType, number>> = {
  [ItemType.PokeBall]: 1.0,
  [ItemType.GreatBall]: 1.5,
  [ItemType.UltraBall]: 2.0,
};

const catchesPokemon = (pokemon: PokemonEncounterType, pokeball: ItemType): boolean => {
  if (pokeball === ItemType.MasterBall) return true;

  const maxHp = getPokemonStats(pokemon.id, pokemon.level).hp;
  // Guard against 0 HP (fainted) — treat as 1 for catch formula
  const currentHp = Math.max(1, pokemon.hp);
  const baseCatchRate = getPokemonMetadata(pokemon.id).baseCatchRate;

  const ballDivisor = ballDivisors[pokeball] ?? 12;
  const ballBonus = ballBonuses[pokeball] ?? 1.0;

  // 1. HP factor (higher at low HP)
  const f = Math.min(Math.max(Math.floor((maxHp * 255 * 4) / (currentHp * ballDivisor)), 1), 255);

  // 2. Modified catch rate
  const a = Math.min(Math.max(Math.floor((f * baseCatchRate) / 255), 1), 255);

  // 3. Apply ball bonus
  const r = Math.min(a * ballBonus, 255);

  // 4. Auto-catch if r >= 255
  if (r >= 255) return true;

  // 5. Each of 4 shake checks: probability = r/255
  //    All 4 must succeed for a catch
  const shakeProb = r / 255;
  return (
    Math.random() < shakeProb &&
    Math.random() < shakeProb &&
    Math.random() < shakeProb &&
    Math.random() < shakeProb
  );
};

export default catchesPokemon;

