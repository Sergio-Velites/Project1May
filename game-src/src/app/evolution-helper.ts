import { PokemonInstance } from "../state/state-types";
import { PokemonMetadata } from "./pokemon-metadata";

// ────────────────────────────────────────────────────────────────────────
// Sistema de evoluciones Gen II: por nivel, por amistad y por hora del día.
//
// Centraliza TODA la lógica de "¿este Pokémon puede evolucionar y a qué
// especie?" para que los dos puntos de disparo (combate en
// PokemonEncounter.tsx y Caramelo Raro en use-item-data.ts) compartan el
// mismo comportamiento sin duplicar código.
// ────────────────────────────────────────────────────────────────────────

/** Amistad base de un Pokémon recién obtenido (Gen II: 70 para la mayoría). */
export const BASE_FRIENDSHIP = 70;
/** Amistad máxima (Gen II: 0–255). */
export const MAX_FRIENDSHIP = 255;
/** Umbral de amistad para evolucionar al subir de nivel (Gen II: 220). */
export const FRIENDSHIP_EVO_THRESHOLD = 220;

/**
 * Pasos necesarios para ganar amistad caminando. Gen II usa 256 pasos por
 * +1, lo que es inalcanzable en una partida corta de boda. Usamos un valor
 * más generoso ("fiel pero alcanzable") para que las evoluciones por
 * amistad se vean jugando con dedicación.
 */
export const STEPS_PER_FRIENDSHIP = 16;

/** Amistad actual de un Pokémon, con base por defecto para saves antiguos. */
export const getFriendship = (p: PokemonInstance): number =>
  p.friendship ?? BASE_FRIENDSHIP;

const clampFriendship = (value: number): number =>
  Math.max(0, Math.min(MAX_FRIENDSHIP, value));

/**
 * Ganancia de amistad por tramos (estilo Gen II): cuanto más alta es la
 * amistad, menos sube de golpe.
 */
const tieredGain = (current: number, low: number, mid: number, high: number): number => {
  if (current < 100) return low;
  if (current < 200) return mid;
  return high;
};

/** Amistad ganada al subir de nivel (Gen II: +5 / +4 / +3 por tramo). */
export const friendshipOnLevelUp = (current: number): number =>
  clampFriendship(current + tieredGain(current, 5, 4, 3));

/** Amistad ganada cada STEPS_PER_FRIENDSHIP pasos caminados. */
export const friendshipOnWalk = (current: number): number =>
  clampFriendship(current + tieredGain(current, 2, 1, 1));

/** Amistad perdida al ser debilitado (Gen II: −1). */
export const friendshipOnFaint = (current: number): number =>
  clampFriendship(current - 1);

/**
 * Hora del día según el reloj real del dispositivo, igual que el reloj
 * interno del GBC en Gen II.
 *   Día   = 4:00 – 17:59  (mañana + día → Espeon)
 *   Noche = 18:00 – 3:59  (→ Umbreon)
 */
export const getTimeOfDay = (): "day" | "night" => {
  const hour = new Date().getHours();
  return hour >= 4 && hour < 18 ? "day" : "night";
};

/** Elige el objetivo de una evolución simple (id único o array aleatorio). */
const pickTarget = (pokemon: number | number[]): number =>
  Array.isArray(pokemon)
    ? pokemon[Math.floor(Math.random() * pokemon.length)]
    : pokemon;

/**
 * Resuelve a qué especie evoluciona un Pokémon, o `null` si todavía no se
 * cumplen las condiciones. Considera nivel, amistad y hora del día según el
 * `trigger` definido en la metadata.
 *
 * Debe llamarse justo después de subir de nivel (que es cuando el original
 * comprueba las evoluciones, incluidas las de amistad).
 */
export const resolveEvolution = (
  pokemon: PokemonInstance,
  meta: PokemonMetadata
): number | null => {
  const evo = meta.evolution;
  if (!evo) return null;

  // Piedra Eterna (Gen II): mientras la lleve equipada, no evoluciona.
  // Comparación por el valor del enum (ItemType.Everstone === "everstone")
  // sin importar use-item-data: evitamos el ciclo
  // use-item-data → evolution-helper → use-item-data.
  if ((pokemon.heldItem as string | null | undefined) === "everstone") return null;

  const trigger = evo.trigger ?? "level";

  if (trigger === "friendship") {
    if (getFriendship(pokemon) < FRIENDSHIP_EVO_THRESHOLD) return null;
    // Gen II no exige nivel mínimo para las evoluciones por amistad; `level`
    // actúa como suelo opcional (por defecto 1 → cualquier subida vale).
    if (pokemon.level < evo.level) return null;
    // Evolución ramificada por hora del día (Eevee → Espeon/Umbreon).
    if (evo.timeOfDay) {
      return getTimeOfDay() === "day" ? evo.timeOfDay.day : evo.timeOfDay.night;
    }
    return pickTarget(evo.pokemon);
  }

  // trigger "level"
  if (pokemon.level < evo.level) return null;
  return pickTarget(evo.pokemon);
};
