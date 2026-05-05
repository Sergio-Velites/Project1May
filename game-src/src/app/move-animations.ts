/**
 * Agrupa los 17 tipos Pokémon en 8 grupos visuales de animación.
 * Esto permite tener efectos CSS diferenciados sin necesitar 17 keyframes.
 */
export type AnimGroup =
  | "fire"
  | "water"
  | "electric"
  | "grass"
  | "ice"
  | "psychic"
  | "physical-impact"
  | "status";

const TYPE_TO_GROUP: Record<string, AnimGroup> = {
  normal:   "physical-impact",
  fighting: "physical-impact",
  poison:   "grass",
  ground:   "physical-impact",
  flying:   "electric",
  bug:      "grass",
  rock:     "physical-impact",
  ghost:    "psychic",
  steel:    "physical-impact",
  fire:     "fire",
  water:    "water",
  grass:    "grass",
  electric: "electric",
  psychic:  "psychic",
  ice:      "ice",
  dragon:   "psychic",
  dark:     "psychic",
  fairy:    "psychic",
};

/**
 * Devuelve el grupo visual de animación para un movimiento dado su tipo y clase.
 * - Los movimientos de estado siempre devuelven "status" (shimmer suave, sin flash de daño).
 * - Los movimientos de daño se mapean por tipo.
 */
export function getMoveAnimGroup(
  type: string,
  damageClass: string
): AnimGroup {
  if (damageClass === "status") return "status";
  return TYPE_TO_GROUP[type.toLowerCase()] ?? "physical-impact";
}
