import { GEN2_SPECIES_DATA } from "./gen2-species-data";

// ─────────────────────────────────────────────────────────────────────────
// Sistema de género (Gen II).
//
// En Oro/Plata el género se deriva del DV de Ataque comparado con el umbral
// del ratio de la especie. Este juego no tiene DVs (stats deterministas),
// así que tiramos la probabilidad equivalente UNA vez al crear el Pokémon y
// la persistimos en el save (`PokemonInstance.gender`).
//
// Lo usan: Atracción (Attract), la Amor Ball (Love Ball) y la UI de stats.
// ─────────────────────────────────────────────────────────────────────────

export type Gender = "male" | "female" | null;

/**
 * Sortea el género de un Pokémon recién creado según el ratio oficial de su
 * especie. `genderRate` está en octavos de probabilidad de hembra
 * (0 = siempre macho, 4 = 50%, 8 = siempre hembra, -1 = sin género).
 */
export const rollGender = (speciesId: number): Gender => {
  const data = GEN2_SPECIES_DATA[speciesId];
  if (!data || data.genderRate < 0) return null;
  return Math.random() * 8 < data.genderRate ? "female" : "male";
};

/** Símbolo para la UI: ♂ / ♀ / cadena vacía para sin género. */
export const genderSymbol = (gender: Gender | undefined): string => {
  if (gender === "male") return "♂";
  if (gender === "female") return "♀";
  return "";
};

/** ¿Pueden estos dos géneros atraerse (Attract / Love Ball)? */
export const areOppositeGenders = (
  a: Gender | undefined,
  b: Gender | undefined
): boolean =>
  (a === "male" && b === "female") || (a === "female" && b === "male");
