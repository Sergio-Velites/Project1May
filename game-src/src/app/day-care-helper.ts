/**
 * day-care-helper — Guardería de Goñi (La Huerta de Goñi).
 *
 * Cada día, cada jugador puede recoger UN Pokémon "bebé" distinto. El bebé del
 * día es determinista por (jugador, fecha): el mismo jugador ve el mismo bebé
 * durante todo el día, y dos jugadores distintos ven bebés distintos el mismo
 * día. Sin mecánicas nuevas: es un regalo diario (como recoger una baya).
 */

/**
 * Pokémon considerados "bebés" (Gen II). Nunca evoluciones ni legendarios.
 * Pichu, Cleffa, Igglybuff, Togepi, Tyrogue, Smoochum, Elekid, Magby.
 */
export const BABY_SPECIES: number[] = [172, 173, 174, 175, 236, 238, 239, 240];

/** Nivel al que se entrega el bebé (como un starter). */
export const DAY_CARE_LEVEL = 5;

/** Fecha local en formato "YYYY-M-D" (misma convención que los árboles de baya). */
export const todayLocalDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** Hash FNV-1a de 32 bits, determinista y estable entre sesiones. */
const hashString = (s: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
};

/** Semilla de jugador: id de nube si existe, si no el nombre del entrenador. */
export const getDayCareSeed = (playerName: string): string => {
  try {
    const id =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("wedding_user_id")
        : null;
    if (id) return id;
  } catch {
    /* localStorage no disponible → usar el nombre */
  }
  return playerName || "guest";
};

/** Bebé del día para (jugador, fecha). Determinista. */
export const dailyBabyId = (seed: string, dateStr: string): number =>
  BABY_SPECIES[hashString(`${seed}|${dateStr}`) % BABY_SPECIES.length];
