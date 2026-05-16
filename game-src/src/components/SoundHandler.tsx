import { useSelector } from "react-redux";
import { selectMap, selectPokemonEncounter, selectTrainerEncounter } from "../state/gameSlice";
import { selectGameboyMenu, selectLoadMenu, selectVideoShown, selectOakIntroActive } from "../state/uiSlice";

import mapData from "../maps/map-data";
import { MapType } from "../maps/map-types";
import { useRef, useState } from "react";
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

  const [musicOverride, setMusicOverride] = useState<string | null>(null);

  // Solo reproducir música de apertura después de que el vídeo haya terminado
  const isOpening = !isGameboyMenu && isLoadScreen && videoShown;

  const getMapMusic = (map: MapType): string => {
    if (map.music) return map.music;
    if (!map.exitReturnMap) throw new Error("map missing music");
    const returnMap = mapData[map.exitReturnMap];
    if (!returnMap) throw new Error("return map missing music");
    return getMapMusic(returnMap);
  };

  const music = () => {
    if (oakIntroActive) return PROFESSOR_OAK;
    if (isOpening) return openingMusic;
    if (musicOverride) return musicOverride;
    if (isGymBattle) return GYM_BATTLE_SFX;
    if (inBattle) return battleMusic;
    const mapMusic = getMapMusic(map);
    if (mapMusic) return mapMusic;
    return undefined;
  };

  const playUiSound = (sound: string, volume = 1) => {
    if (uiSoundRef.current) uiSoundRef.current.volume = volume;
    setUiSound(sound);
  };

  const setOverrideFor = (src: string, durationMs: number) => {
    setMusicOverride(src);
    setTimeout(() => setMusicOverride(null), durationMs);
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
    setOverrideFor(VICTORY_TRAINER, VICTORY_TRAINER_MS);
  });

  useEvent(Event.VictoryWild, () => {
    setOverrideFor(VICTORY_WILD, VICTORY_WILD_MS);
  });

  useEvent(Event.VictoryGym, () => {
    setOverrideFor(VICTORY_GYM, VICTORY_GYM_MS);
  });

  useEvent(Event.Evolution, () => {
    setOverrideFor(EVOLUTION_MUSIC, EVOLUTION_MS);
  });

  useEvent(Event.EvolutionEnd, () => {
    setMusicOverride(null);
  });

  return (
    <>
      <audio autoPlay loop src={music()} />
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

