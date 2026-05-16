/**
 * Mapeo de move IDs (slugs PokeAPI) a archivos MP3 de la colección
 * "Pokemon SFX Gen 1 - Attack Moves - RBY".
 *
 * Conversión por defecto: split por "-" → PascalCase → /game/sfx/attacks/{Name}.mp3
 * Excepciones explícitas donde el filename difiere del PascalCase estándar.
 *
 * getMoveSfxPath devuelve null si el movimiento no tiene SFX Gen I asignado.
 * El consumidor debe ignorar null silenciosamente (no reproducir nada).
 */

const BASE_URL = "/game/sfx/attacks";

/**
 * Overrides donde el nombre del archivo en el pack SFX Gen I NO sigue
 * el PascalCase estándar derivado del slug.
 */
const OVERRIDES: Record<string, string> = {
  // Nombres comprimidos (dos palabras fusionadas en minúscula)
  "bubble-beam":    "Bubblebeam",
  "sonic-boom":     "Sonicboom",
  // ID del juego difiere del nombre del archivo
  "hi-jump-kick":   "HighJumpKick",
  // Fly tiene dos fases: FlyUp (carga) y FlyHit (golpe). Usamos FlyHit.
  "fly":            "FlyHit",
  // Un solo slug en el juego, dos palabras en el archivo
  "twineedle":      "TwinNeedle",
  "bonemerang":     "Bonemerang",
};

/**
 * Movimientos que sabemos con certeza que no tienen archivo en el pack Gen I
 * (son de Gen II en adelante, o no existen en la colección).
 * Listados explícitamente para evitar peticiones 404 en runtime.
 */
const NO_SOUND = new Set<string>([
  // Gen II+
  "spark", "zap-cannon", "leaf-blade", "hail", "shadow-ball",
  "mean-look", "destiny-bond", "sand-tomb", "rock-blast",
  "ancient-power", "cotton-spore", "sweet-scent", "mud-slap",
  "rollout", "crunch", "sludge-bomb", "water-sport", "whirlpool",
  "steel-wing", "false-swipe", "encore", "endure", "protect",
  "thief", "snore", "outrage", "flail", "reversal", "iron-tail",
  "mach-punch", "cross-chop", "vital-throw", "dynamic-punch",
]);

/** Convierte un slug "thunder-wave" → "ThunderWave" */
function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * Devuelve la ruta pública al archivo MP3 del SFX del movimiento,
 * o null si el movimiento no tiene SFX asignado.
 *
 * @param moveId  Slug PokeAPI del movimiento (ej. "thunder-wave", "ember").
 */
export function getMoveSfxPath(moveId: string): string | null {
  if (!moveId || NO_SOUND.has(moveId)) return null;

  const override = OVERRIDES[moveId];
  const filename = override ?? toPascalCase(moveId);

  return `${BASE_URL}/${filename}.mp3`;
}
