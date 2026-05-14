import { MoveState, PokemonInstance } from "../state/state-types";
import { getMoveMetadata } from "./use-move-metadata";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

export type GrowthRate = "fast" | "medium-fast" | "medium-slow" | "slow";

/**
 * Total XP required to BE at level n (Gen I formulas).
 * Medium-Slow formula can be negative for level < 5 — clamped to 0.
 */
export const totalXpForLevel = (level: number, growthRate: GrowthRate): number => {
  const n = level;
  switch (growthRate) {
    case "fast":
      return Math.floor((4 * Math.pow(n, 3)) / 5);
    case "medium-fast":
      return Math.pow(n, 3);
    case "medium-slow":
      return Math.max(
        0,
        Math.floor((6 * Math.pow(n, 3)) / 5) - 15 * n * n + 100 * n - 140
      );
    case "slow":
      return Math.floor((5 * Math.pow(n, 3)) / 4);
  }
};

const getLevelData = (
  currentLevel: number,
  currentExp: number,
  growthRate: GrowthRate = "medium-fast",
  leveledUp = false
): { level: number; leveledUp: boolean; remainingXp: number } => {
  const nextLevel = currentLevel + 1;
  // XP needed to advance one level = totalXp(n+1) - totalXp(n)
  const nextLevelXp =
    totalXpForLevel(nextLevel, growthRate) -
    totalXpForLevel(currentLevel, growthRate);
  if (currentExp >= nextLevelXp) {
    return getLevelData(nextLevel, currentExp - nextLevelXp, growthRate, true);
  }
  return {
    level: currentLevel,
    leveledUp: leveledUp,
    remainingXp: currentExp,
  };
};

export default getLevelData;

/**
 * Sube EXACTAMENTE un nivel si la XP alcanza para el siguiente nivel.
 * Devuelve `{ level, leveledUp, remainingXp }`. Pensado para iterar en
 * bucle desde el componente de combate y poder aprender movimientos /
 * evolucionar entre niveles intermedios.
 */
export const getSingleLevelUp = (
  currentLevel: number,
  currentExp: number,
  growthRate: GrowthRate = "medium-fast"
): { level: number; leveledUp: boolean; remainingXp: number } => {
  if (currentLevel >= 100) {
    return { level: currentLevel, leveledUp: false, remainingXp: currentExp };
  }
  const nextLevelXp =
    totalXpForLevel(currentLevel + 1, growthRate) -
    totalXpForLevel(currentLevel, growthRate);
  if (currentExp >= nextLevelXp) {
    return {
      level: currentLevel + 1,
      leveledUp: true,
      remainingXp: currentExp - nextLevelXp,
    };
  }
  return { level: currentLevel, leveledUp: false, remainingXp: currentExp };
};

/**
 * XP necesaria para pasar del nivel `currentLevel` al `currentLevel + 1`.
 * Se usa para decidir si seguir el bucle de subidas graduales.
 */
export const xpForNextLevel = (
  currentLevel: number,
  growthRate: GrowthRate = "medium-fast"
): number => {
  if (currentLevel >= 100) return Infinity;
  return (
    totalXpForLevel(currentLevel + 1, growthRate) -
    totalXpForLevel(currentLevel, growthRate)
  );
};

/**
 * Returns how much HP is gained when a Pokémon levels up.
 * In Gen I, current HP increases by the same amount as the max HP increase.
 * This prevents the HP from being lower than before leveling up.
 */
export const getHpDeltaOnLevelUp = (
  pokemonId: number,
  oldLevel: number,
  newLevel: number
): number => {
  const oldMaxHp = getPokemonStats(pokemonId, oldLevel).hp;
  const newMaxHp = getPokemonStats(pokemonId, newLevel).hp;
  return Math.max(0, newMaxHp - oldMaxHp);
};

export const getLearnedMove = (pokemon: PokemonInstance): MoveState | null => {
  const pokemonMetadata = getPokemonMetadata(pokemon.id);
  const moves = pokemonMetadata.moves;
  const move = moves.find((move) => move.levelLearnedAt === pokemon.level);
  if (!move) return null;
  if (pokemon.moves.some((m) => m.id === move.name)) return null;
  return {
    id: move.name,
    pp: getMoveMetadata(move.name).pp || 0,
  };
};
