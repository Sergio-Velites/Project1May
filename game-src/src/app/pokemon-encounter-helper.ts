import { PokemonEncounterType } from "../state/state-types";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

const NON_GEN2_ENEMY_MOVES = new Set(["scary-face"]);

const getPokemonEncounter = (
  id: number,
  level: number
): PokemonEncounterType => {
  const metadata = getPokemonMetadata(id);
  const moves = metadata.moves
    .filter((move) => move.levelLearnedAt <= level)
    .filter((move) => !NON_GEN2_ENEMY_MOVES.has(move.name))
    .sort((a, b) => b.levelLearnedAt - a.levelLearnedAt)
    .slice(0, 4)
    .map((move) => move.name);
  return {
    id,
    level,
    hp: getPokemonStats(id, level).hp,
    moves,
  };
};

export default getPokemonEncounter;
