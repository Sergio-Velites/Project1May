import { getPokemonMetadata } from "./use-pokemon-metadata";

// Gen I XP formula:
// Wild:    baseExperience * enemyLevel / 7
// Trainer: baseExperience * enemyLevel / 7 * 1.5
// Divided by number of participants (shared XP handled at call site)
const getXp = (enemyId: number, enemyLevel: number, isTrainerBattle = false): number => {
  const metadata = getPokemonMetadata(enemyId);
  const base = Math.round((metadata.baseExperience * enemyLevel) / 7);
  return isTrainerBattle ? Math.round(base * 1.5) : base;
};

export default getXp;
