import { MoveState, PokemonInstance } from "../state/state-types";
import { getMoveMetadata } from "./use-move-metadata";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

const getLevelData = (
  currentLevel: number,
  currentExp: number,
  leveledUp = false
): { level: number; leveledUp: boolean; remainingXp: number } => {
  const nextLevel = currentLevel + 1;
  // Gen I Medium-Fast: XP needed to advance one level = nextLevel^3 - currentLevel^3
  const nextLevelXp = Math.pow(nextLevel, 3) - Math.pow(currentLevel, 3);
  if (currentExp >= nextLevelXp) {
    return getLevelData(nextLevel, currentExp - nextLevelXp, true);
  }
  return {
    level: currentLevel,
    leveledUp: leveledUp,
    remainingXp: currentExp,
  };
};

export default getLevelData;

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
