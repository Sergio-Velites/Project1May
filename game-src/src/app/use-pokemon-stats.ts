import { getPokemonMetadata } from "./use-pokemon-metadata";

export interface PokemonStats {
  id: number;
  name: string;
  hp: number;
  attack: number;
  defense: number;
  /**
   * Gen I unifica Special en un único stat usado tanto para ataque como
   * para defensa especial. El split SpA/SpD llegó en Gen II.
   */
  special: number;
  speed: number;
}

export const getPokemonStats = (id: number, level: number): PokemonStats => {
  const metadata = getPokemonMetadata(id);

  const hp = Math.round((2 * metadata.baseStats.hp * level) / 100 + level + 10);
  const attack = Math.round((2 * metadata.baseStats.attack * level) / 100 + 5);
  const defense = Math.round(
    (2 * metadata.baseStats.defense * level) / 100 + 5
  );
  const special = Math.round(
    (2 * metadata.baseStats.special * level) / 100 + 5
  );
  const speed = Math.round((2 * metadata.baseStats.speed * level) / 100 + 5);

  return {
    id,
    name: metadata.name,
    hp,
    attack,
    defense,
    special,
    speed,
  };
};

const usePokemonStats = (id: number, level: number): PokemonStats => {
  return getPokemonStats(id, level);
};

export default usePokemonStats;
