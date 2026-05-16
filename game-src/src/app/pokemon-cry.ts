// Pokémon cry — versión minimalista basada en el patrón original que ya
// funcionaba antes de las regresiones.
//
// CRÍTICO: hay que MANTENER una referencia al HTMLAudioElement entre
// `new Audio(...)` y el callback `.play()`. Si el Audio sale de scope,
// algunos navegadores (Safari, Chrome con memory pressure) lo recolectan
// como basura y `play()` se silencia sin error. El bug "no oigo los
// gritos de mi pokémon nunca" venía exactamente de esto.
//
// Diseño:
//   · Sin Promises, sin onloadedmetadata, sin onended.
//   · `playCry(id)` crea un nuevo Audio, lo guarda en `lastAudio` para
//      mantenerlo vivo, y arranca `play()` con catch silencioso.
//   · Lock fijo de 1100 ms para que la UI pueda esperar al grito.

const CRY_LOCK_MS = 1100;

// Mantener viva la última Audio. Sin esta referencia el GC se la lleva
// antes de que play() arranque y el sonido se pierde silenciosamente.
let lastAudio: HTMLAudioElement | null = null;
let lockUntil = 0;

const cryPath = (id: number): string =>
  "/game/sfx/pokemon-cries/" + String(id).padStart(3, "0") + ".mp3";

export const playCry = (id: number): void => {
  lockUntil = Date.now() + CRY_LOCK_MS;
  try {
    const a = new Audio(cryPath(id));
    a.volume = 1;
    lastAudio = a; // mantener referencia viva
    a.play().catch(() => {});
  } catch {
    // Silencioso: el lock ya está puesto.
  }
};

export const isCryActive = (): boolean => Date.now() < lockUntil;

export const cryLockRemainingMs = (): number =>
  Math.max(0, lockUntil - Date.now());

/**
 * Ejecuta `cb` cuando el lock del grito en curso termina (o ya).
 * Siempre vía setTimeout (aunque sea 0ms) para mantener orden consistente.
 */
export const waitForCry = (cb: () => void): void => {
  const remaining = cryLockRemainingMs();
  setTimeout(cb, remaining);
};

/** Resetea el lock y libera la referencia al último audio. */
export const cancelCry = (): void => {
  lockUntil = 0;
  if (lastAudio) {
    try {
      lastAudio.pause();
    } catch {
      // ignore
    }
    lastAudio = null;
  }
};



