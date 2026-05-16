// Singleton helper for Pokémon cry playback (Gen I style).
//
// Garantías:
//   1. Solo un grito a la vez: si llega otro, se interrumpe el anterior
//      antes de iniciar el nuevo (los gritos no se solapan).
//   2. `playCry(id)` devuelve una Promise<number> con la duración real
//      del audio (ms). Resuelve cuando el audio termina de sonar (o tras
//      un fallback si el navegador no dispara `ended`).
//   3. `isCryActive()` y `cryLockUntil()` exponen el estado para que la
//      capa de UI bloquee inputs y/o retrase transiciones de escena.
//   4. Robusto ante fallos de carga: si el audio no se puede reproducir
//      (404, autoplay bloqueado, etc.) usa un fallback de 700 ms para no
//      colgar nunca a la UI.

const CRY_FALLBACK_MS = 700;     // duración mínima asumida si el audio no carga
const CRY_MIN_LOCK_MS = 1100;    // lock mínimo (mantiene UX original)
const CRY_MAX_LOCK_MS = 2500;    // tope de seguridad por si un audio es eterno

let currentAudio: HTMLAudioElement | null = null;
let lockUntil = 0;

const cryPath = (id: number): string =>
  "/game/sfx/pokemon-cries/" + String(id).padStart(3, "0") + ".mp3";

const stopCurrent = (): void => {
  if (!currentAudio) return;
  try {
    currentAudio.onended = null;
    currentAudio.onerror = null;
    currentAudio.pause();
    currentAudio.src = "";
  } catch {
    // ignore
  }
  currentAudio = null;
};

/**
 * Reproduce el grito del Pokémon `id`. Devuelve una Promise<number> con
 * los ms reservados como lock (>= CRY_MIN_LOCK_MS). Resuelve al terminar
 * el audio o tras el fallback.
 */
export const playCry = (id: number): Promise<number> => {
  // Cortar cualquier grito previo: dos gritos NUNCA se solapan.
  stopCurrent();

  let audio: HTMLAudioElement | null = null;
  try {
    audio = new Audio(cryPath(id));
    audio.volume = 1;
  } catch {
    audio = null;
  }

  if (!audio) {
    lockUntil = Date.now() + CRY_FALLBACK_MS;
    return new Promise((resolve) =>
      setTimeout(() => resolve(CRY_FALLBACK_MS), CRY_FALLBACK_MS)
    );
  }

  currentAudio = audio;
  // Lock inicial pesimista: se ajusta cuando llega metadata.
  let lockMs = CRY_MIN_LOCK_MS;
  lockUntil = Date.now() + lockMs;

  return new Promise<number>((resolve) => {
    let settled = false;
    const settle = (ms: number) => {
      if (settled) return;
      settled = true;
      if (currentAudio === audio) currentAudio = null;
      resolve(ms);
    };

    audio!.onloadedmetadata = () => {
      const dur = (audio!.duration || 0) * 1000;
      if (dur > 0 && Number.isFinite(dur)) {
        // Reservamos al menos CRY_MIN_LOCK_MS, como tope CRY_MAX_LOCK_MS.
        // Añadimos 100ms de cola para que la voz no se corte abrupta.
        lockMs = Math.min(
          CRY_MAX_LOCK_MS,
          Math.max(CRY_MIN_LOCK_MS, Math.round(dur) + 100)
        );
        lockUntil = Date.now() + lockMs;
      }
    };
    audio!.onended = () => settle(lockMs);
    audio!.onerror = () => {
      lockUntil = Date.now() + CRY_FALLBACK_MS;
      settle(CRY_FALLBACK_MS);
    };

    // Fallback duro: si pasan CRY_MAX_LOCK_MS y nadie nos liberó, resolvemos.
    setTimeout(() => settle(lockMs), CRY_MAX_LOCK_MS);

    audio!.play().catch(() => {
      // Autoplay bloqueado u otro fallo: liberamos rápido con fallback.
      lockUntil = Date.now() + CRY_FALLBACK_MS;
      setTimeout(() => settle(CRY_FALLBACK_MS), CRY_FALLBACK_MS);
    });
  });
};

export const isCryActive = (): boolean => Date.now() < lockUntil;

export const cryLockRemainingMs = (): number =>
  Math.max(0, lockUntil - Date.now());

/** Limpia el estado del módulo (llamar al salir de combate). */
export const cancelCry = (): void => {
  stopCurrent();
  lockUntil = 0;
};
