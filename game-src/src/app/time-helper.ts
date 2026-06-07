/**
 * Tramos horarios estilo Pokémon Oro/Plata/Cristal (Gen II).
 *
 * Se usan para condicionar qué Pokémon aparecen en cada mapa según la hora
 * real del dispositivo. Una entrada de encuentro SIN tramos asignados
 * (`timesOfDay` undefined o vacío) se considera disponible las 24 horas
 * → comportamiento por defecto: nada cambia respecto a la configuración previa.
 *
 * Rangos (hora local 0–23):
 *   - morning: 04:00 – 09:59
 *   - day:     10:00 – 17:59
 *   - night:   18:00 – 03:59
 */
export type TimeSegment = "morning" | "day" | "night";

export const TIME_SEGMENTS: TimeSegment[] = ["morning", "day", "night"];

export const TIME_SEGMENT_LABELS: Record<TimeSegment, string> = {
  morning: "Mañana",
  day: "Día",
  night: "Noche",
};

/** Devuelve el tramo horario actual a partir de la hora local del dispositivo. */
export const getTimeSegment = (date: Date = new Date()): TimeSegment => {
  const h = date.getHours();
  if (h >= 4 && h < 10) return "morning";
  if (h >= 10 && h < 18) return "day";
  return "night";
};

/**
 * ¿Está disponible una entrada de encuentro en el tramo `seg`?
 * `allowed` undefined o vacío → disponible siempre (24 h).
 */
export const matchesTimeSegment = (
  allowed: TimeSegment[] | undefined,
  seg: TimeSegment
): boolean => !allowed || allowed.length === 0 || allowed.includes(seg);
