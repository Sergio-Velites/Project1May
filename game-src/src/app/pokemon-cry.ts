// Pokémon cry playback helper — réplica del comportamiento Gen I.
//
// En el juego original el grito dura ~1s, suena en cuanto el sprite aparece
// y bloquea cualquier transición hasta que termina. No queremos OVERLAP entre
// gritos (rival → tuyo en secuencia rápida cuando hay un KO encadenado).
//
// Diseño deliberadamente simple:
//   · `playCry(id)`: corta cualquier audio en curso, crea y reproduce el
//      nuevo. Devuelve el `HTMLAudioElement` (o null si la creación falló).
//      NO usa Promises ni onloadedmetadata — esos APIs introducen races
//      sutiles (la metadata puede llegar tarde por red, onended a veces
//      no dispara si el src se sustituye, etc.). En su lugar fijamos un
//      lock temporal generoso de CRY_LOCK_MS que cubre el grito completo.
//   · `isCryActive()`: la capa de UI consulta esto para bloquear inputs.
//   · `waitForCry()`: helper para encadenar la siguiente acción justo
//      después del lock (evita tener que .then en cada caller).
//   · `cancelCry()`: pause + reset, llamar al salir de combate.

const CRY_LOCK_MS = 1200; // duración real de los .mp3 ≤ ~1.1s; +100ms cola

let currentAudio: HTMLAudioElement | null = null;
let lockUntil = 0;

const cryPath = (id: number): string =>
  "/game/sfx/pokemon-cries/" + String(id).padStart(3, "0") + ".mp3";

const stopCurrent = (): void => {
  const a = currentAudio;
  currentAudio = null;
  if (!a) return;
  try {
    a.pause();
    a.currentTime = 0;
  } catch {
    // ignore
  }
};

export const playCry = (id: number): HTMLAudioElement | null => {
  // Si hay un grito en curso, lo cortamos para evitar solape (un solo grito
  // a la vez, igual que el original).
  stopCurrent();
  try {
    const a = new Audio(cryPath(id));
    a.volume = 1;
    currentAudio = a;
    lockUntil = Date.now() + CRY_LOCK_MS;
    // Nota: a.play() devuelve Promise — la atrapamos para no ensuciar la
    // consola si el navegador bloquea autoplay. NUNCA esperamos esa Promise:
    // queremos que el lock arranque aunque play() resuelva tarde.
    a.play().catch(() => {});
    return a;
  } catch {
    return null;
  }
};

export const isCryActive = (): boolean => Date.now() < lockUntil;

export const cryLockRemainingMs = (): number =>
  Math.max(0, lockUntil - Date.now());

/**
 * Ejecuta `cb` justo cuando el grito en curso termina (o inmediatamente si
 * no hay grito activo). Útil para encadenar la siguiente fase de la
 * animación sin que el audio se corte.
 */
export const waitForCry = (cb: () => void): void => {
  const remaining = cryLockRemainingMs();
  if (remaining <= 0) cb();
  else setTimeout(cb, remaining);
};

/** Limpia el estado (llamar al salir de combate). */
export const cancelCry = (): void => {
  stopCurrent();
  lockUntil = 0;
};

