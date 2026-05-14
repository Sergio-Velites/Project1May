/**
 * Mapa slug → descripción legible (ES) de las quests/logros del juego.
 * Mantener sincronizado con:
 *   - game-src/src/app/use-quests.ts            (quests narrativas)
 *   - game-src/src/components/LabPokeball.tsx   (`lab-starter-taken-{id}`)
 *   - game-src/src/components/AcademyPokeballModal.tsx (Ditto academia)
 *   - mapas con `questId:` en game-src/src/maps/
 */
import POKEMON_NAMES_GEN1 from "./pokemon-names";

const STATIC_QUESTS: Record<string, string> = {
  // Narrativas (use-quests.ts)
  "madre-bronca-done": "Bronca de mamá superada",
  "pewter-museum-1f-paid": "Entrada del museo de VILLAMAYOR pagada",
  "vino-tinto-dado": "Vino Tinto recibido del Maestro del Vino",

  // Academia (Ditto)
  "academy-ditto-taken": "Ditto recogido en la Academia Pokémon",

  // Static / regalos / text-reward de mapas concretos
  "route-2-static-0-2": "Pokémon estático de Ruta 2",
  "gate-house-gift-9-2": "Regalo de la Caseta de la Guía",
  "mt-moon-3f-static-27-3": "Pokémon estático del Monte Luna 3F (27,3)",
  "mt-moon-3f-static-26-27": "Pokémon estático del Monte Luna 3F (26,27)",
  "mt-moon-3f-static-5-17": "Pokémon estático del Monte Luna 3F (5,17)",
  "mt-moon-3f-static-23-11": "Pokémon estático del Monte Luna 3F (23,11)",
  "viridian-city-gym-gift-2-2": "Regalo del Gimnasio de SOTO LEZKAIRU",
  "viridian-city-npc-house-static-7-7":
    "Pokémon estático en casa NPC de SOTO LEZKAIRU",
  "text-reward-pewter-city-museum-1f-2-3":
    "Recompensa del museo de VILLAMAYOR (1F)",
  "text-reward-pewter-city-museum-2f-11-2":
    "Recompensa del museo de VILLAMAYOR (2F)",
  "text-reward-pewter-city-29-8":
    "Recompensa hablando con NPC de VILLAMAYOR (29,8)",
  "pewter-city-static-29-24": "Pokémon estático de VILLAMAYOR (29,24)",
  "pewter-city-static-29-8": "Pokémon estático de VILLAMAYOR (29,8)",
};

export const questLabel = (slug: string): string => {
  if (STATIC_QUESTS[slug]) return STATIC_QUESTS[slug];

  // Iniciales del laboratorio: lab-starter-taken-{pokemonId}
  const starterMatch = slug.match(/^lab-starter-taken-(\d+)$/);
  if (starterMatch) {
    const id = Number(starterMatch[1]);
    const name = POKEMON_NAMES_GEN1[id - 1] ?? `#${id}`;
    return `Inicial elegido: ${name}`;
  }

  // Fallback: slug crudo, capitalizado y con espacios
  return slug
    .split("-")
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(" ");
};
