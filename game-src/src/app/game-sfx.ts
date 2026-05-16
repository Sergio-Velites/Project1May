/**
 * game-sfx.ts
 *
 * Helper para reproducir SFX/jingles del juego (no de movimientos de combate).
 * Usa new Audio() de forma fire-and-forget — fail-silent si el archivo no existe.
 *
 * Las URLs apuntan a /game/sfx/game/{slug}.mp3 que CRA copia del directorio
 * game-src/public/sfx/game/ durante el build.
 */

const BASE = "/game/sfx/game";

export const GAME_SFX = {
  levelUp:             `${BASE}/level-up.mp3`,
  victoryTrainer:      `${BASE}/victory-trainer.mp3`,
  victoryWild:         `${BASE}/victory-wild.mp3`,
  victoryGym:          `${BASE}/victory-gym.mp3`,
  pokemonCaught:       `${BASE}/pokemon-caught.mp3`,
  pokemonObtained:     `${BASE}/pokemon-obtained.mp3`,
  itemObtained:        `${BASE}/item-obtained.mp3`,
  evolution:           `${BASE}/evolution.mp3`,
  battleGym:           `${BASE}/battle-gym.mp3`,
  trainerAppearsBoy:   `${BASE}/trainer-appears-boy.mp3`,
  trainerAppearsGirl:  `${BASE}/trainer-appears-girl.mp3`,
  trainerAppearsRocket:`${BASE}/trainer-appears-rocket.mp3`,
  professorOak:        `${BASE}/professor-oak.mp3`,
} as const;

export type GameSfxKey = keyof typeof GAME_SFX;

/**
 * Reproduce un SFX del juego de forma fire-and-forget.
 * Si el archivo no existe o el usuario bloqueó el audio, falla silenciosamente.
 */
export function playGameSfx(path: string, volume = 1): HTMLAudioElement | null {
  try {
    const audio = new Audio(path);
    audio.volume = volume;
    audio.play().catch(() => {});
    return audio;
  } catch {
    return null;
  }
}
