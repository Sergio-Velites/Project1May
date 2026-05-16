import { useSelector } from "react-redux";
import { selectMap, selectOnBicycle, selectOnSurfing, selectPokemonEncounter, selectTrainerEncounter } from "../state/gameSlice";
import { selectGameboyMenu, selectLoadMenu, selectVideoShown, selectOakIntroActive } from "../state/uiSlice";

import mapData from "../maps/map-data";
import { MapType } from "../maps/map-types";
import { useRef, useState, useEffect } from "react";
import { Event } from "../app/emitter";
import useEvent from "../app/use-event";

import openingMusic from "../assets/music/ui/opening.mp3";
import buttonPress from "../assets/music/ui/button-press.wav";
import enterDoor from "../assets/music/ui/enter-door.mp3";
import battleMusic from "../assets/music/ui/battle.mp3";
import healPokemon from "../assets/music/ui/pokemon-recovery.mp3";

const GYM_BATTLE_SFX   = "/game/sfx/game/battle-gym.mp3";
const VICTORY_TRAINER  = "/game/sfx/game/victory-trainer.mp3";
const VICTORY_WILD     = "/game/sfx/game/victory-wild.mp3";
const VICTORY_GYM      = "/game/sfx/game/victory-gym.mp3";
const EVOLUTION_MUSIC  = "/game/sfx/game/evolution.mp3";
const PROFESSOR_OAK    = "/game/sfx/game/professor-oak.mp3";
const POKEMON_CAUGHT_SFX   = "/game/sfx/game/pokemon-caught.mp3";
const POKEMON_OBTAINED_SFX = "/game/sfx/game/pokemon-obtained.mp3";
const SURF_MUSIC           = "/game/sfx/game/surf.mp3";
const BICYCLE_MUSIC        = "/game/sfx/game/bicycle.mp3";

// Duraciones aproximadas de cada jingle en ms (usadas para el override de música)
const VICTORY_TRAINER_MS = 38000;
const VICTORY_WILD_MS    = 38000;
const VICTORY_GYM_MS     = 51000;
const EVOLUTION_MS       = 30000;

const SoundHandler = () => {
  const map = useSelector(selectMap);
  const isLoadScreen = useSelector(selectLoadMenu);
  const isGameboyMenu = useSelector(selectGameboyMenu);
  const videoShown = useSelector(selectVideoShown);
  const oakIntroActive = useSelector(selectOakIntroActive);
  const [uiSound, setUiSound] = useState<string | undefined>(undefined);
  const uiSoundRef = useRef<HTMLAudioElement>(null);
  const inBattle = !!useSelector(selectPokemonEncounter);
  const trainerEncounter = useSelector(selectTrainerEncounter);
  const isGymBattle = inBattle && !!trainerEncounter?.isGymLeader;
  const onSurfing = useSelector(selectOnSurfing);
  const onBicycle = useSelector(selectOnBicycle);

  const [musicOverride, setMusicOverride] = useState<string | null>(null);

  // jingleSrc: reproduce una vez (sin loop) y al terminar dispara afterJingleRef
  const [jingleSrc, setJingleSrc] = useState<string | null>(null);
  const afterJingleRef = useRef<(() => void) | null>(null);

  // clearOnBattleEnd: limpia musicOverride cuando inBattle pasa a false
  const [clearOnBattleEnd, setClearOnBattleEnd] = useState(false);

  // Solo reproducir música de apertura después de que el vídeo haya terminado
  const isOpening = !isGameboyMenu && isLoadScreen && videoShown;

  // Limpiar overrides al cerrar el combate (cualquier final: huida, KO,
  // victoria, captura). Garantiza que la música del mapa vuelva siempre.
  useEffect(() => {
    if (!inBattle && clearOnBattleEnd) {
      setMusicOverride(null);
      setJingleSrc(null);
      afterJingleRef.current = null;
      setClearOnBattleEnd(false);
    }
  }, [inBattle, clearOnBattleEnd]);

  const getMapMusic = (map: MapType): string => {
    if (map.music) return map.music;
    if (!map.exitReturnMap) throw new Error("map missing music");
    const returnMap = mapData[map.exitReturnMap];
    if (!returnMap) throw new Error("return map missing music");
    return getMapMusic(returnMap);
  };

  const music = () => {
    if (jingleSrc) return jingleSrc;      // jingle de captura/obtenido (una reproducción)
    if (oakIntroActive) return PROFESSOR_OAK;
    if (isOpening) return openingMusic;
    if (musicOverride) return musicOverride;
    if (isGymBattle) return GYM_BATTLE_SFX;
    if (inBattle) return battleMusic;
    // Surf y bici se comportan como "mapas" alternativos: sustituyen la
    // música del mapa actual mientras estén activos. En combate prevalece
    // la música de batalla; al salir vuelve a sonar surf/bici.
    if (onSurfing) return SURF_MUSIC;
    if (onBicycle) return BICYCLE_MUSIC;
    const mapMusic = getMapMusic(map);
    if (mapMusic) return mapMusic;
    return undefined;
  };

  const playJingle = (src: string, onEnd?: () => void) => {
    setJingleSrc(src);
    afterJingleRef.current = onEnd || null;
  };

  const handleJingleEnded = () => {
    setJingleSrc(null);
    if (afterJingleRef.current) {
      afterJingleRef.current();
      afterJingleRef.current = null;
    }
  };

  const playUiSound = (sound: string, volume = 1) => {
    if (uiSoundRef.current) uiSoundRef.current.volume = volume;
    setUiSound(sound);
  };

  const setOverrideFor = (src: string, durationMs: number) => {
    setMusicOverride(src);
    setTimeout(() => setMusicOverride(null), durationMs);
  };

  // Wrapper: además de aplicar override+timeout, marca que al cerrar el
  // combate hay que limpiar inmediatamente (los jingles de victoria duran
  // más que el combate normalmente).
  const setBattleOverrideFor = (src: string, durationMs: number) => {
    setOverrideFor(src, durationMs);
    setClearOnBattleEnd(true);
  };

  useEvent(Event.A, () => {
    playUiSound(buttonPress, 0.2);
  });

  useEvent(Event.B, () => {
    playUiSound(buttonPress, 0.2);
  });

  useEvent(Event.EnterDoor, () => {
    playUiSound(enterDoor);
  });

  useEvent(Event.HealPokemon, () => {
    setMusicOverride(healPokemon);
    setTimeout(() => {
      setMusicOverride(null);
    }, 3000);
  });

  useEvent(Event.VictoryTrainer, () => {
    setBattleOverrideFor(VICTORY_TRAINER, VICTORY_TRAINER_MS);
  });

  useEvent(Event.VictoryWild, () => {
    setBattleOverrideFor(VICTORY_WILD, VICTORY_WILD_MS);
  });

  useEvent(Event.VictoryGym, () => {
    setBattleOverrideFor(VICTORY_GYM, VICTORY_GYM_MS);
  });

  useEvent(Event.Evolution, () => {
    setOverrideFor(EVOLUTION_MUSIC, EVOLUTION_MS);
  });

  useEvent(Event.EvolutionEnd, () => {
    setMusicOverride(null);
  });

  // Captura: jingle de captura (una vez) → victory-wild en loop hasta salir del combate
  useEvent(Event.PokemonCaught, () => {
    // Marcar inmediatamente: si el combate termina antes incluso de que
    // acabe el jingle de captura, limpiar el jingle también.
    setClearOnBattleEnd(true);
    playJingle(POKEMON_CAUGHT_SFX, () => {
      setMusicOverride(VICTORY_WILD);
      setClearOnBattleEnd(true);
    });
  });

  // Obtener pokémon (starter/regalo): jingle una vez, luego vuelve la música del mapa
  useEvent(Event.PokemonObtained, () => {
    playJingle(POKEMON_OBTAINED_SFX);
  });

  return (
    <>
      <audio
        autoPlay
        loop={!jingleSrc}
        src={music()}
        onEnded={jingleSrc ? handleJingleEnded : undefined}
      />
      <audio
        ref={uiSoundRef}
        autoPlay
        src={uiSound}
        onEnded={() => setUiSound(undefined)}
      />
    </>
  );
};

export default SoundHandler;

