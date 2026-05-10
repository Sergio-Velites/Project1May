import { useDispatch, useSelector } from "react-redux";
import styled, { css, keyframes } from "styled-components";
import {
  addInventory,
  addPokemon,
  defeatTrainer,
  encounterPokemon,
  endEncounter,
  faintToTrainer,
  gainMoney,
  recoverFromFainting,
  resetActivePokemon,
  selectActivePokemon,
  selectActivePokemonIndex,
  selectName,
  selectPokemon,
  selectPokemonEncounter,
  selectTrainerEncounter,
  setActivePokemon,
  updatePokemon,
  updatePokemonEncounter,
  updateSpecificPokemon,
  seePokemon,
  catchPokemonPokedex,
} from "../state/gameSlice";
import usePokemonMetadata, { getPokemonMetadata } from "../app/use-pokemon-metadata";
import Frame from "./Frame";
import HealthBar from "./HealthBar";
import usePokemonStats, { getPokemonStats } from "../app/use-pokemon-stats";

import corner from "../assets/ui/corner.png";
import { useEffect, useState, useRef } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";

import playerBack from "../assets/battle/player-back.png";

import ball1 from "../assets/battle/ball-open-1.png";
import ball2 from "../assets/battle/ball-open-2.png";
import ball3 from "../assets/battle/ball-open-3.png";
import ball4 from "../assets/battle/ball-open-4.png";
import ball5 from "../assets/battle/ball-open-5.png";
import ballIdle from "../assets/battle/ball-idle.png";
import ballLeft from "../assets/battle/ball-left.png";
import ballRight from "../assets/battle/ball-right.png";
import Menu, { MenuItemType } from "./Menu";
import PokemonList from "./PokemonList";
import {
  selectEvolution,
  selectItemsMenu,
  selectPokeballThrowing,
  selectStartMenu,
  showEvolution,
  showItemsMenu,
  showTextThenAction,
  stopThrowingPokeball,
} from "../state/uiSlice";
import useIsMobile from "../app/use-is-mobile";
import { getMoveMetadata } from "../app/use-move-metadata";
import { MoveMetadata } from "../app/move-metadata";
import processMove, { MoveResult, StatStages, DEFAULT_STAGES, getStageMult } from "../app/move-helper";
import getXp from "../app/xp-helper";
import getLevelData, { getLearnedMove, getHpDeltaOnLevelUp } from "../app/level-helper";
import MoveSelect from "./MoveSelect";
import catchesPokemon from "../app/pokeball-helper";
import { MoveAnimation } from "./MoveAnimation";
import { PokemonEncounterType, PokemonInstance } from "../state/state-types";
import getPokemonEncounter from "../app/pokemon-encounter-helper";
import PixelImage from "../styles/PixelImage";

const MOVEMENT_ANIMATION = 1300;
const FRAME_DURATION = 100;
const ATTACK_ANIMATION = 600;
const IDLE_BALL_DURATION = 1000;

const StyledPokemonEncounter = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  padding-top: 0.8cqw;
  display: flex;
  flex-direction: column;
  width: 100%;

  height: 70%;
`;

const Row = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  flex: 1;
`;

const LeftInfoSection = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-left: 5%;
`;

const RightInfoSection = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  margin-right: 5%;
`;

const Name = styled.div`
  font-size: 3.5cqw;
  font-family: "PokemonGB";
  text-transform: uppercase;
`;

const Level = styled.div`
  font-size: 3.2cqw;
  margin: 0 7.5cqw;
  font-family: "PressStart2P", sans-serif;
`;

const HealthBarContainer = styled.div`
  margin: 0 2.1cqw;
  margin-top: 0.8cqw;
`;

const Health = styled.div`
  font-family: "PokemonGB";
  font-size: 3.5cqw;
  margin: 0 2.1cqw;
  margin-top: 0.8cqw;
`;

const flashing = keyframes`
  0% {
    opacity: 1;
  }
  10% {
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  30% {
    opacity: 0;
  }
  40% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  60% {
    opacity: 1;
  }
  70% {
    opacity: 0;
  }
  80% {
    opacity: 1;
  }
  90% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`;

interface ImageContainerProps {
  $flashing?: boolean;
}

const ImageContainer = styled.div<ImageContainerProps>`
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  ${(props: ImageContainerProps) =>
    props.$flashing &&
    css`
      animation: ${flashing} 500ms linear forwards;
    `};
`;

const changePokemon = keyframes`
  0% {
    transform: translateX(0%);
    opacity: 1;
  }
  50% {
    transform: translateX(-400%);
    opacity: 1;
  }
  51% {
    transform: translateX(-400%);
    opacity: 0;
  }
  99% {
    transform: translateX(0%);
    opacity: 0;
  }
  100% {
    transform: translateX(0%);
    opacity: 1;
  }
`;

interface ChangePokemonProps {
  $changing: boolean;
}

const ChangePokemon = styled.div<ChangePokemonProps>`
  height: 100%;

  ${(props: ChangePokemonProps) =>
    props.$changing &&
    css`
      animation: ${changePokemon} ${MOVEMENT_ANIMATION * 2}ms linear forwards;
    `};
`;

const changeEnemyPokemon = keyframes`
  0% {
    transform: translateX(0%);
    opacity: 1;
  }
  50% {
    transform: translateX(400%);
    opacity: 1;
  }
  51% {
    transform: translateX(400%);
    opacity: 0;
  }
  99% {
    transform: translateX(0%);
    opacity: 0;
  }
  100% {
    transform: translateX(0%);
    opacity: 1;
  }
`;

const ChangeEnemyPokemon = styled.div<ChangePokemonProps>`
  height: 100%;

  ${(props: ChangePokemonProps) =>
    props.$changing &&
    css`
      animation: ${changeEnemyPokemon} ${MOVEMENT_ANIMATION * 2}ms linear
        forwards;
    `};
`;

const inFromRight = keyframes`
  from {
    transform: translateX(400%);
  }
  to {
    transform: translateX(0%);
  }
`;

const LeftImage = styled(PixelImage)`
  height: 100%;

  transform: translate(400%);
  animation: ${inFromRight} ${`${MOVEMENT_ANIMATION}ms`} linear forwards;
`;

const inFromLeft = keyframes`
  from {
    transform: translateX(-400%);
  }
  to {
    transform: translateX(0%);
  }
`;

const RightImage = styled(PixelImage)`
  height: 100%;

  transform: translate(-400%);
  animation: ${inFromLeft} ${`${MOVEMENT_ANIMATION}ms`} linear forwards;
`;

const attackRight = keyframes`
  0% {
    transform: translateX(0%);
  }
  50% {
    transform: translateX(50%);
  }
  100% {
    transform: translateX(0%);
  }
`;

interface AttackingProps {
  $attacking?: boolean;
}

const AttackRight = styled.div<AttackingProps>`
  height: 100%;
  transform: translateX(0%);
  ${(props: AttackingProps) =>
    props.$attacking &&
    css`
      animation: ${attackRight} ${ATTACK_ANIMATION}ms linear forwards;
    `};
`;

const attackLeft = keyframes`
  0% {
    transform: translateX(0%);
  }
  50% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0%);
  }
`;

const AttackLeft = styled.div<AttackingProps>`
  height: 100%;
  transform: translateX(0%);
  ${(props: AttackingProps) =>
    props.$attacking &&
    css`
      animation: ${attackLeft} ${ATTACK_ANIMATION}ms linear forwards;
    `};
`;

const Corner = styled(PixelImage)`
  transform: translateY(-50%);
  height: 5.1cqw;
`;

const CornerContainer = styled.div`
  height: 2.7cqw;
`;

const CornerRight = styled(PixelImage)`
  height: 5.1cqw;
  transform: translateY(-70%) scaleX(-1);
`;

const TextContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  z-index: 100;
`;

const moveLeft = keyframes`
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0%);
  }
`;

const moveRight = keyframes`
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0%);
  }
`;

const RightSide = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 5%,
    rgba(0, 0, 0, 1) 5%,
    rgba(0, 0, 0, 1) 10%,
    rgba(0, 0, 0, 0) 10%,
    rgba(0, 0, 0, 0) 15%,
    rgba(0, 0, 0, 1) 15%,
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 0) 20%,
    rgba(0, 0, 0, 0) 25%,
    rgba(0, 0, 0, 1) 25%,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0) 30%,
    rgba(0, 0, 0, 0) 35%,
    rgba(0, 0, 0, 1) 35%,
    rgba(0, 0, 0, 1) 40%,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 0) 45%,
    rgba(0, 0, 0, 1) 45%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 0) 55%,
    rgba(0, 0, 0, 1) 55%,
    rgba(0, 0, 0, 1) 60%,
    rgba(0, 0, 0, 0) 60%,
    rgba(0, 0, 0, 0) 65%,
    rgba(0, 0, 0, 1) 65%,
    rgba(0, 0, 0, 1) 70%,
    rgba(0, 0, 0, 0) 70%,
    rgba(0, 0, 0, 0) 75%,
    rgba(0, 0, 0, 1) 75%,
    rgba(0, 0, 0, 1) 80%,
    rgba(0, 0, 0, 0) 80%,
    rgba(0, 0, 0, 0) 85%,
    rgba(0, 0, 0, 1) 85%,
    rgba(0, 0, 0, 1) 90%,
    rgba(0, 0, 0, 0) 90%,
    rgba(0, 0, 0, 0) 95%,
    rgba(0, 0, 0, 1) 95%,
    rgba(0, 0, 0, 1) 100%
  );

  transform: translateX(100%);

  animation: ${moveLeft} 1500ms linear forwards;
`;

const LeftSide = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 1) 0%,
    rgba(0, 0, 0, 1) 5%,
    rgba(0, 0, 0, 0) 5%,
    rgba(0, 0, 0, 0) 10%,
    rgba(0, 0, 0, 1) 10%,
    rgba(0, 0, 0, 1) 15%,
    rgba(0, 0, 0, 0) 15%,
    rgba(0, 0, 0, 0) 20%,
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 1) 25%,
    rgba(0, 0, 0, 0) 25%,
    rgba(0, 0, 0, 0) 30%,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 1) 35%,
    rgba(0, 0, 0, 0) 35%,
    rgba(0, 0, 0, 0) 40%,
    rgba(0, 0, 0, 1) 40%,
    rgba(0, 0, 0, 1) 45%,
    rgba(0, 0, 0, 0) 45%,
    rgba(0, 0, 0, 0) 50%,
    rgba(0, 0, 0, 1) 50%,
    rgba(0, 0, 0, 1) 55%,
    rgba(0, 0, 0, 0) 55%,
    rgba(0, 0, 0, 0) 60%,
    rgba(0, 0, 0, 1) 60%,
    rgba(0, 0, 0, 1) 65%,
    rgba(0, 0, 0, 0) 65%,
    rgba(0, 0, 0, 0) 70%,
    rgba(0, 0, 0, 1) 70%,
    rgba(0, 0, 0, 1) 75%,
    rgba(0, 0, 0, 0) 75%,
    rgba(0, 0, 0, 0) 80%,
    rgba(0, 0, 0, 1) 80%,
    rgba(0, 0, 0, 1) 85%,
    rgba(0, 0, 0, 0) 85%,
    rgba(0, 0, 0, 0) 90%,
    rgba(0, 0, 0, 1) 90%,
    rgba(0, 0, 0, 1) 95%,
    rgba(0, 0, 0, 0) 95%,
    rgba(0, 0, 0, 0) 100%
  );

  transform: translateX(-100%);
  animation: ${moveRight} 1500ms linear forwards;
`;

const BlackOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  z-index: 100;
`;

const PokemonEncounter = () => {
  const dispatch = useDispatch();
  const enemy = useSelector(selectPokemonEncounter);
  const enemyMetadata = usePokemonMetadata(enemy?.id || null);
  const enemyStats = usePokemonStats(enemy?.id || 1, enemy?.level || 1);
  const active = useSelector(selectActivePokemon);
  const activeMetadata = usePokemonMetadata(active?.id || null);
  const activeStats = usePokemonStats(active?.id || 1, active?.level || 1);
  const itemMenuOpen = useSelector(selectItemsMenu);
  const isMobile = useIsMobile();
  const pokemon = useSelector(selectPokemon);
  const name = useSelector(selectName);
  const startMenuOpen = useSelector(selectStartMenu);
  const pokeballThrowing = useSelector(selectPokeballThrowing);
  const trainer = useSelector(selectTrainerEncounter);
  const activePokemonIndex = useSelector(selectActivePokemonIndex);

  // 0 = intro animation started
  // 1 = intro animation finished
  // 2 = showing pokemon
  // 3 = player out
  // 4 = go pokemon
  // 5 = ball open 1
  // 6 = ball open 2
  // 7 = ball open 3
  // 8 = ball open 4
  // 9 = ball open 5
  // 10 = show pokemon
  // 11 = in battle
  // 12 = running
  // 13 = pokemon list
  // 14 = moves
  // 15 = us prepare attack
  // 17 = us damage
  // 18 = them prepare attack
  // 19 = them damage
  // 20 = they fainted
  // 21 = gained xp
  // 22 = leveled up
  // 24 = active fainted
  // 25 = select new pokemon
  // 26 = out of pokemon
  // 27 = player fainted
  // 28 = black screen
  // 29 = new move
  // 30 = trying to learn new move
  // 31 = but cannot learn more than 4 moves
  // 32 = select move to forget
  // 33 = forgot move
  // 34 = enemy ball open 1
  // 35 = enemy ball open 2
  // 36 = enemy ball open 3
  // 37 = enemy ball open 4
  // 38 = enemy ball open 5
  // 39 = ball idle
  // 40 = ball left
  // 41 = ball right
  // 42 = Darn! The POKéMON broke free!
  // 43 = Aww! It appeared to be caught!
  // 44 = Shoot! It was so close too!
  // 45 = You caught a wild POKéMON!
  // 46 = Enemy out
  // 47 = Enemy go pokemon
  // 48 = Enemy pokemon out
  // 49 = Enemy pokemon out (during battle)
  // 50 = defeated trainer
  // 51 = battle outro
  // 52 = receiving money
  const [stage, setStage] = useState(-1);
  const [trainerPokemonIndex, setTrainerPokemonIndex] = useState(0);
  const [outroIndex, setOutroIndex] = useState(0);
  const [involvedPokemon, setInvolvedPokemon] = useState<number[]>([0]);
  const [processingInvolvedPokemon, setProcessingInvolvedPokemon] = useState(0);
  const processingPokemon =
    pokemon[involvedPokemon[processingInvolvedPokemon] || 0];
  const processingMetadata = usePokemonMetadata(processingPokemon?.id || null);
  const pokemonEvolving = useSelector(selectEvolution);

  const [alertText, setAlertText] = useState<string | null>(null);
  const [clickableNotice, setClickableNotice] = useState<string | null>(null);
  const [moveAnim, setMoveAnim] = useState<{
    moveId: string;
    target: "enemy" | "player";
    damageClass: string;
  } | null>(null);
  // Ref to pass computed XP from stage 20 to stage 21 without stale closure
  const pendingXpRef = useRef<number | null>(null);
  // Ref to pass new level from stage 21 to stages 22/29/33 without stale closure
  const pendingLevelRef = useRef<number | null>(null);

  // Stat stages — reset al inicio de cada combate
  const [playerStages, setPlayerStages] = useState<StatStages>(DEFAULT_STAGES);
  const [enemyStages, setEnemyStages] = useState<StatStages>(DEFAULT_STAGES);

  // Transformación — keyed por activePokemonIndex para que sea por pokémon individual
  // Persiste durante todo el combate: si cambias a otro pokémon y vuelves a sacar
  // a Ditto, sigue transformado.
  const [transformedData, setTransformedData] = useState<Record<number, { id: number; moves: { id: string; pp: number }[] }>>({});
  // Accesores convenientes para el pokémon activo
  const currentTransform = transformedData[activePokemonIndex] ?? null;
  const transformedId    = currentTransform?.id    ?? null;
  const transformedMoves = currentTransform?.moves  ?? [];

  // Condiciones de estado en combate (no se persisten en Redux)
  type BattleStatus = { type: "poison" | "badly-poisoned" | "burn" | "paralysis" | "sleep" | "freeze"; turns: number };
  const [playerStatus, setPlayerStatus] = useState<BattleStatus | null>(null);
  const [enemyStatus, setEnemyStatus] = useState<BattleStatus | null>(null);
  // Refs para evitar stale-closures en los timeouts de processBattle
  const playerStatusRef = useRef<BattleStatus | null>(null);
  const enemyStatusRef = useRef<BattleStatus | null>(null);
  useEffect(() => { playerStatusRef.current = playerStatus; }, [playerStatus]);
  useEffect(() => { enemyStatusRef.current = enemyStatus; }, [enemyStatus]);

  // Leech Seed (puede coexistir con otros estados — se guarda por separado)
  const [playerLeechSeeded, setPlayerLeechSeeded] = useState(false);
  const [enemyLeechSeeded, setEnemyLeechSeeded] = useState(false);
  const playerLeechSeededRef = useRef(false);
  const enemyLeechSeededRef  = useRef(false);
  useEffect(() => { playerLeechSeededRef.current = playerLeechSeeded; }, [playerLeechSeeded]);
  useEffect(() => { enemyLeechSeededRef.current  = enemyLeechSeeded;  }, [enemyLeechSeeded]);

  // Último daño físico recibido por el jugador (para Counter)
  const lastPhysicalDamageRef = useRef(0);

  // Flinch refs — el objetivo de un golpe con flinch no puede actuar ese turno
  const enemyFlinchRef  = useRef(false);
  const playerFlinchRef = useRef(false);

  const isInBattle = !!enemy && !!active && !!enemyMetadata && !!activeMetadata;

  const isTrainer = !!trainer;
  const isThrowingEnemyPokeball = stage >= 34 && stage <= 38 && isTrainer;

  const handleEvolution = () => {
    if (!processingMetadata) return;
    if (!processingMetadata.evolution) return;
    if (processingPokemon.level < processingMetadata.evolution.level) return;
    dispatch(
      showEvolution({
        index: involvedPokemon[processingInvolvedPokemon],
        evolveToId: processingMetadata.evolution.pokemon,
      })
    );
  };

  const endEncounter_ = (exitBattle = false) => {
    // Handle evolutions
    handleEvolution();

    // Handling switching to the next processing pokemon
    if (processingInvolvedPokemon < involvedPokemon.length - 1) {
      const nextIndex = processingInvolvedPokemon + 1;
      if (enemy) {
        dispatch(
          updateSpecificPokemon({
            index: involvedPokemon[nextIndex],
            pokemon: {
              ...pokemon[involvedPokemon[nextIndex]],
              xp:
                pokemon[involvedPokemon[nextIndex]].xp +
                Math.round(
                  getXp(enemy.id, enemy.level, isTrainer) / involvedPokemon.length
                ),
            },
          })
        );
      }
      setProcessingInvolvedPokemon(nextIndex);
      setStage(21);
      return;
    }
    setInvolvedPokemon([activePokemonIndex]);
    setProcessingInvolvedPokemon(0);

    // Ending encounter
    if (exitBattle) {
      setTrainerPokemonIndex(0);
      dispatch(endEncounter());
      dispatch(faintToTrainer());
      return;
    }

    // Bringing out the trainers next pokemon
    if (isTrainer && trainerPokemonIndex < trainer?.pokemon.length - 1) {
      const newIndex = trainerPokemonIndex + 1;
      const newPokemon = trainer?.pokemon[newIndex];
      dispatch(
        encounterPokemon(getPokemonEncounter(newPokemon.id, newPokemon.level))
      );
      setTrainerPokemonIndex(newIndex);
      throwPokeballAtEnemy(49);
      return;
    }

    // Trainer outtro
    if (isTrainer && trainerPokemonIndex === trainer?.pokemon.length - 1) {
      setStage(50);
      setTrainerPokemonIndex(10);
      return;
    }

    // Ending encounter
    setTrainerPokemonIndex(0);
    dispatch(endEncounter());

    if (isTrainer) {
      // Defeated trainer
      if (trainerPokemonIndex === 10) {
        dispatch(defeatTrainer());

        // Handling post game
        if (trainer.postGame) {
          dispatch(
            showTextThenAction({
              text: trainer.postGame.message,
              action: () => {
                if (trainer.postGame?.items) {
                  trainer.postGame.items.forEach((item) => {
                    dispatch(addInventory({ item, amount: 1 }));
                  });
                }
              },
            })
          );
        }
      }

      // Fainted
      else {
        dispatch(faintToTrainer());
      }
    }
  };

  useEffect(() => {
    // Si hay encuentro pero el jugador no tiene pokémon activo (equipo vacío o
    // todos KO antes de que se repare), limpiar el encounter para evitar bloqueo.
    if (enemy && !active) {
      dispatch(faintToTrainer());
      dispatch(endEncounter());
    }
  }, [enemy, active, dispatch]);

  useEffect(() => {
    if (isInBattle) {
      dispatch(resetActivePokemon());
      setPlayerStages(DEFAULT_STAGES);
      setEnemyStages(DEFAULT_STAGES);
      setTransformedData({});
      setPlayerStatus(null);
      setEnemyStatus(null);
      playerStatusRef.current = null;
      enemyStatusRef.current = null;
      setPlayerLeechSeeded(false);
      setEnemyLeechSeeded(false);
      playerLeechSeededRef.current = false;
      enemyLeechSeededRef.current  = false;
      lastPhysicalDamageRef.current = 0;
      enemyFlinchRef.current  = false;
      playerFlinchRef.current = false;
      setMoveAnim(null);
      setStage(0);
      // Register enemy as SEEN in Pokédex
      dispatch(seePokemon(enemy.id));
      setTimeout(() => {
        setStage(1);
      }, 2000);
      setTimeout(() => {
        setStage(2);
      }, 3300);
    }

    if (!isInBattle) {
      setStage(-1);
    }
  }, [isInBattle, dispatch]);

  const throwPokeball = () => {
    setTimeout(() => {
      setStage(4);
    }, MOVEMENT_ANIMATION);
    setTimeout(() => {
      setStage(5);
    }, MOVEMENT_ANIMATION * 2);
    setTimeout(() => {
      setStage(6);
    }, MOVEMENT_ANIMATION * 2 + FRAME_DURATION);
    setTimeout(() => {
      setStage(7);
    }, MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 2);
    setTimeout(() => {
      setStage(8);
    }, MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 3);
    setTimeout(() => {
      setStage(9);
    }, MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 4);
    setTimeout(() => {
      setStage(10);
    }, MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 5);
    setTimeout(() => {
      setStage(11);
    }, MOVEMENT_ANIMATION * 2 + FRAME_DURATION * 5 + 500);
  };

  const throwPokeballAtEnemy = (end: number = 39) => {
    setStage(34);
    setTimeout(() => {
      setStage(35);
    }, FRAME_DURATION);
    setTimeout(() => {
      setStage(36);
    }, FRAME_DURATION * 2);
    setTimeout(() => {
      setStage(37);
    }, FRAME_DURATION * 3);
    setTimeout(() => {
      setStage(38);
    }, FRAME_DURATION * 4);
    setTimeout(() => {
      setStage(end);
    }, FRAME_DURATION * 5);
  };

  useEffect(() => {
    if (pokeballThrowing && enemy) {
      if (isTrainer) {
        setClickableNotice("¡El entrenador bloqueó la Poké Ball!");
        return;
      }

      const shakePokeball = (
        times: number,
        caught: boolean,
        startTimes?: number
      ) => {
        setStage(39);
        setTimeout(() => {
          setStage(40);
        }, IDLE_BALL_DURATION);
        setTimeout(() => {
          setStage(39);
        }, IDLE_BALL_DURATION + FRAME_DURATION);
        setTimeout(() => {
          setStage(41);
        }, IDLE_BALL_DURATION + FRAME_DURATION * 2);
        setTimeout(() => {
          setStage(39);
        }, IDLE_BALL_DURATION + FRAME_DURATION * 3);

        if (times > 1) {
          setTimeout(() => {
            shakePokeball(times - 1, caught, startTimes || times);
          }, IDLE_BALL_DURATION + FRAME_DURATION * 4);
        }
        if (times === 1) {
          setTimeout(() => {
            if (caught) {
              setStage(45);
            } else {
              throwPokeballAtEnemy();
              setTimeout(() => {
                const effectiveTimes = startTimes ?? times;
                if (effectiveTimes === 1) {
                  setStage(42);
                } else if (effectiveTimes === 2) {
                  setStage(43);
                } else if (effectiveTimes === 3) {
                  setStage(44);
                } else {
                  setStage(42);
                }
              }, FRAME_DURATION * 6);
            }
          }, IDLE_BALL_DURATION + FRAME_DURATION * 4);
        }
      };

      throwPokeballAtEnemy();
      const caught = catchesPokemon(enemy, pokeballThrowing);
      setTimeout(() => {
        if (caught) {
          shakePokeball(3, caught);
        } else {
          // 1, 2 or 3 shakes
          const shakes = Math.floor(Math.random() * 3) + 1;
          shakePokeball(shakes, caught);
        }
      }, FRAME_DURATION * 6);
      dispatch(stopThrowingPokeball());
    }
  }, [pokeballThrowing, enemy, dispatch, isTrainer]);

  useEvent(Event.A, () => {
    if (startMenuOpen) return;
    if (pokemonEvolving !== null) return;

    if (clickableNotice) {
      setClickableNotice(null);
    }

    if (stage === 2) {
      setInvolvedPokemon([activePokemonIndex]);
      setProcessingInvolvedPokemon(0);
      if (isTrainer) {
        setStage(46);
        setTimeout(() => {
          throwPokeballAtEnemy(48);
        }, 1000);
      } else {
        setStage(3);
        throwPokeball();
      }
    }

    if (stage === 48) {
      setStage(3);
      throwPokeball();
    }

    if (stage === 49) {
      setStage(11);
    }

    if (stage === 12) {
      endEncounter_();
    }

    if (stage === 20) {
      setStage(21);
      if (enemy) {
        // BUG FIX: compute total XP here and pass it through so stage 21
        // reads the updated value (avoids stale closure on processingPokemon.xp)
        const earnedXp = Math.round(
          getXp(enemy.id, enemy.level, isTrainer) / involvedPokemon.length
        );
        const updatedXp = processingPokemon.xp + earnedXp;
        dispatch(
          updateSpecificPokemon({
            index: involvedPokemon[processingInvolvedPokemon],
            pokemon: {
              ...processingPokemon,
              xp: updatedXp,
            },
          })
        );
        // Store computed xp so stage 21 handler can use it reliably
        pendingXpRef.current = updatedXp;
      }
    }

    if (stage === 21) {
      // Use pendingXpRef to avoid stale closure from Redux dispatch above
      const xpToUse = pendingXpRef.current ?? processingPokemon.xp;
      const { level, leveledUp, remainingXp } = getLevelData(
        processingPokemon.level,
        xpToUse,
        processingMetadata?.growthRate ?? "medium-fast"
      );
      if (leveledUp) {
        // Gen I: current HP increases by the same amount as max HP
        const hpDelta = getHpDeltaOnLevelUp(processingPokemon.id, processingPokemon.level, level);
        dispatch(
          updateSpecificPokemon({
            index: involvedPokemon[processingInvolvedPokemon],
            pokemon: {
              ...processingPokemon,
              level,
              xp: remainingXp,
              hp: processingPokemon.hp + hpDelta,
            },
          })
        );
        pendingXpRef.current = null;
        pendingLevelRef.current = level;
        setStage(22);
      } else {
        pendingXpRef.current = null;
        endEncounter_();
      }
    }

    if (stage === 22) {
      // Use pendingLevelRef to avoid stale closure: Redux already dispatched new level
      // but processingPokemon from selector may still show old level in this render.
      const pokemonForLearn = pendingLevelRef.current !== null
        ? { ...processingPokemon, level: pendingLevelRef.current }
        : processingPokemon;
      const move = getLearnedMove(pokemonForLearn);
      const hasFourMoves = processingPokemon.moves.length === 4;
      if (move && !hasFourMoves) {
        setStage(29);
      } else if (move && hasFourMoves) {
        setStage(30);
      } else {
        endEncounter_();
      }
    }

    if (stage === 24) {
      const hasOtherPokemon = pokemon.some((p) => p.hp > 0);
      if (hasOtherPokemon) {
        setStage(25);
      } else {
        setStage(26);
      }
    }

    if (stage === 26) {
      setStage(27);
    }

    if (stage === 27) {
      setStage(28);
      setTimeout(() => {
        endEncounter_(true);          // cerrar la batalla PRIMERO
      }, 1000);
      setTimeout(() => {
        dispatch(recoverFromFainting());  // curar y teleportar DESPUES
      }, 1500);
    }

    if (stage === 29) {
      const pokemonForLearn = pendingLevelRef.current !== null
        ? { ...processingPokemon, level: pendingLevelRef.current }
        : processingPokemon;
      const move = getLearnedMove(pokemonForLearn);
      if (!move) throw new Error("No move found");
      dispatch(
        updateSpecificPokemon({
          index: involvedPokemon[processingInvolvedPokemon],
          pokemon: {
            ...processingPokemon,
            moves: [...processingPokemon.moves, move],
          },
        })
      );
      pendingLevelRef.current = null;
      endEncounter_();
    }

    if (stage === 30) {
      setStage(31);
    }

    if (stage === 31) {
      setStage(32);
    }

    if (stage === 32) {
      setStage(33);
    }

    if ([42, 43, 44].includes(stage)) {
      setStage(11);
    }

    if (stage === 45) {
      if (!enemy) throw new Error("No enemy found");
      if (!enemyMetadata) throw new Error("No enemy metadata found");
      const teamFull = pokemon.length >= 6;
      dispatch(
        addPokemon({
          id: enemy.id,
          level: enemy.level,
          xp: 0,
          moves: enemy.moves.map((move) => {
            return {
              id: move,
              pp: getMoveMetadata(move).pp || 0,
            };
          }),
          // Keep current HP (Gen I behaviour: caught pokemon retains battle HP)
          hp: Math.max(1, enemy.hp),
        })
      );
      // Register as CAUGHT in Pokédex
      dispatch(catchPokemonPokedex(enemy.id));
      if (teamFull) {
        setStage(53);
      } else {
        endEncounter_();
      }
    }

    if (stage === 53) {
      endEncounter_();
    }

    if (stage === 50) {
      setStage(51);
    }

    if (stage === 51) {
      if (!trainer) throw new Error("No trainer found");
      if (trainer.outtro.length - 1 > outroIndex) {
        setOutroIndex(outroIndex + 1);
      } else {
        setStage(52);
      }
    }

    if (stage === 52) {
      if (!trainer) throw new Error("No trainer found");
      dispatch(gainMoney(trainer.money || 0));
      endEncounter_();
    }
  });

  if (!isInBattle) return null;

  const text = () => {
    if (clickableNotice) return clickableNotice;
    if (alertText) return alertText;
    if (stage === 2) {
      if (isTrainer) {
        return `¡${trainer?.npc.name.toUpperCase()} quiere combatir!`;
      }
      return `¡${enemyMetadata.name.toUpperCase()} salvaje apareció!`;
    }
    if (stage >= 4 && stage < 10)
      return `¡Adelante, ${activeMetadata.name.toUpperCase()}!`;
    if (stage === 12) return "¡Escapaste con éxito!";
    if (stage === 20)
      return `¡${enemyMetadata.name.toUpperCase()} rival se debilitó!`;
    if (stage === 21) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      return `${processingMetadata.name.toUpperCase()} ganó ${Math.round(
        getXp(enemy.id, enemy.level, isTrainer) / involvedPokemon.length
      )} puntos EXP.`;
    }
    if (stage === 22) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      return `¡${processingMetadata.name.toUpperCase()} subió al nivel ${
        getLevelData(processingPokemon.level, processingPokemon.xp, processingMetadata?.growthRate ?? "medium-fast").level
      }!`;
    }
    if (stage === 24) return `¡${activeMetadata.name.toUpperCase()} se debilitó!`;
    if (stage === 26) return `¡${name} no tiene más POKéMON!`;
    if (stage === 27) return `¡${name} fue derrotado!`;
    if (stage === 29) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      const move = getLearnedMove(processingPokemon);
      if (!move) throw new Error("No move found");
      return `¡${processingMetadata.name.toUpperCase()} aprendió ${(getMoveMetadata(move.id)?.name ?? move.id).toUpperCase()}!`;
    }
    if (stage === 30) {
      if (!processingMetadata) throw new Error("No processing metadata found");
      const move = getLearnedMove(processingPokemon);
      if (!move) throw new Error("No move found");
      return `${processingMetadata.name.toUpperCase()} intenta aprender ${(getMoveMetadata(move.id)?.name ?? move.id).toUpperCase()}.`;
    }
    if (stage === 31) return `Pero no puede aprender más de 4 movimientos`;
    if (stage === 32) return `Elige el movimiento que quieres olvidar`;
    if (stage === 42) return `¡Vaya! ¡El POKéMON se escapó!`;
    if (stage === 43) return `¡Casi! ¡Parecía que iba a quedar atrapado!`;
    if (stage === 44) return `¡Uf! ¡Por tan poco!`;
    if (stage === 45)
      return `¡Bien! ¡${enemyMetadata.name.toUpperCase()} fue capturado!`;
    if (stage === 53)
      return `¡El equipo está lleno! ¡${enemyMetadata.name.toUpperCase()} fue enviado al PC!`;
    if (stage === 48 || stage === 49) {
      return `¡${trainer?.npc.name.toUpperCase()} sacó a ${enemyMetadata.name.toUpperCase()}!`;
    }
    if (stage === 50)
      return `¡${name.toUpperCase()} derrotó a ${trainer?.npc.name.toUpperCase()}!`;
    if (stage === 51) {
      return trainer?.outtro[outroIndex] || "";
    }
    if (stage === 52)
      return `¡${name.toUpperCase()} recibió $${trainer?.money} por ganar!`;

    return "";
  };

  const getRandomEnemyMove = () => {
    if (!enemy.moves || enemy.moves.length === 0) return "tackle";
    return enemy.moves[Math.floor(Math.random() * enemy.moves.length)];
  };

  const getActiveMovesFirst = (
    activeMove: MoveMetadata,
    enemyMove: MoveMetadata
  ) => {
    if (activeMove.priority > enemyMove.priority) return true;
    if (activeMove.priority < enemyMove.priority) return false;
    // Apply speed stat stages for priority calculation (Gen I)
    const playerSpeed = activeStats.speed * getStageMult(playerStages.speed);
    const enemySpeed  = enemyStats.speed  * getStageMult(enemyStages.speed);
    if (playerSpeed > enemySpeed) return true;
    if (playerSpeed < enemySpeed) return false;
    // Speed tie: random (Gen I)
    return Math.random() < 0.5;
  };

  const STAT_NAMES_ES: Record<string, string> = {
    attack:   "ATAQUE",
    defense:  "DEFENSA",
    speed:    "VELOCIDAD",
    special:  "ESPECIAL",
    accuracy: "PRECISIÓN",
    evasion:  "EVASION",
  };

  const applyStatChange = (
    statChange: MoveResult["statChange"],
    isAttacking: boolean
  ) => {
    if (!statChange) return;
    const { stat, target, delta } = statChange;
    // 'attacker' cuando isAttacking=true → jugador ; cuando false → enemigo
    const affectsPlayer =
      (isAttacking && target === "attacker") ||
      (!isAttacking && target === "defender");

    const targetName = affectsPlayer
      ? activeMetadata.name.toUpperCase()
      : enemyMetadata.name.toUpperCase();
    const statNameES = STAT_NAMES_ES[stat] ?? stat.toUpperCase();

    // Verificar límite ±6
    const currentStage = affectsPlayer
      ? playerStages[stat as keyof StatStages]
      : enemyStages[stat as keyof StatStages];
    if (delta > 0 && currentStage >= 6) {
      setAlertText(`¡El ${statNameES} de ${targetName} no subirá más!`);
      return;
    }
    if (delta < 0 && currentStage <= -6) {
      setAlertText(`¡El ${statNameES} de ${targetName} no bajará más!`);
      return;
    }

    const dir = delta > 0 ? "subió" : "bajó";
    const magnitude = Math.abs(delta) >= 2 ? " mucho" : "";

    setAlertText(`¡El ${statNameES} de ${targetName}${magnitude} ${dir}!`);

    const clamp = (v: number) => Math.max(-6, Math.min(6, v));
    if (affectsPlayer) {
      setPlayerStages((prev) => ({
        ...prev,
        [stat]: clamp(prev[stat as keyof StatStages] + delta),
      }));
    } else {
      setEnemyStages((prev) => ({
        ...prev,
        [stat]: clamp(prev[stat as keyof StatStages] + delta),
      }));
    }
  };

  // ── Helper: aplica una condición de estado y muestra el mensaje ───────────
  const applyStatus = (
    statusApply: { status: string; target: "attacker" | "defender" },
    isAttacking: boolean
  ): boolean => {
    const STATUS_MSG: Record<string, string> = {
      "poison":         "quedó envenenado",
      "badly-poisoned": "quedó gravemente envenenado",
      "burn":           "sufrió una quemadura",
      "paralysis":      "quedó paralizado",
      "sleep":          "se quedó dormido",
      "freeze":         "se congeló",
      "leech-seed":     "fue sembrado con Drenadoras",
    };
    // "defender" = el objetivo del movimiento; "attacker" = quien lo usa
    const affectsPlayer =
      (isAttacking  && statusApply.target === "attacker") ||
      (!isAttacking && statusApply.target === "defender");

    const targetName = affectsPlayer
      ? activeMetadata.name.toUpperCase()
      : enemyMetadata.name.toUpperCase();

    // Leech Seed se gestiona aparte (puede coexistir con otro estado)
    if (statusApply.status === "leech-seed") {
      if (affectsPlayer) {
        if (playerLeechSeededRef.current) return false;
        setPlayerLeechSeeded(true);
        playerLeechSeededRef.current = true;
      } else {
        if (enemyLeechSeededRef.current) return false;
        setEnemyLeechSeeded(true);
        enemyLeechSeededRef.current = true;
      }
      setAlertText(`¡${targetName} ${STATUS_MSG["leech-seed"]}!`);
      return true;
    }

    const currentStatus = affectsPlayer ? playerStatusRef.current : enemyStatusRef.current;
    if (currentStatus) return false; // ya tiene un estado: no se puede aplicar otro

    type BT = { type: "poison"|"badly-poisoned"|"burn"|"paralysis"|"sleep"|"freeze"; turns: number };
    const newStatus: BT = {
      type: statusApply.status as BT["type"],
      turns: statusApply.status === "sleep"          ? 1 + Math.floor(Math.random() * 5)
           : statusApply.status === "badly-poisoned" ? 1
           : 0,
    };
    if (affectsPlayer) {
      setPlayerStatus(newStatus);
      playerStatusRef.current = newStatus;
    } else {
      setEnemyStatus(newStatus);
      enemyStatusRef.current = newStatus;
    }
    setAlertText(`¡${targetName} ${STATUS_MSG[statusApply.status] ?? statusApply.status}!`);
    return true;
  };

  const processMoveResult = (
    result: MoveResult,
    isAttacking: boolean,
    moveId?: string
  ): { us: PokemonInstance; them: PokemonEncounterType } => {
    const {
      us,
      them,
      missed,
      superEffective,
      moveName,
      critical,
      notVeryEffective,
      statChange,
      isTransform,
      statusApply,
    } = result;
    if (isAttacking) {
      if (moveId) {
        const moveDataAnim = getMoveMetadata(moveId);
        setMoveAnim({
          moveId,
          target: "enemy",
          damageClass: moveDataAnim?.damageClass ?? "physical",
        });
      }
      setAlertText(
        `¡${activeMetadata.name.toUpperCase()} usó ${moveName.toUpperCase()}!`
      );
      setStage(15);
      setTimeout(() => {
        dispatch(updatePokemonEncounter(them));
        // Cuando transformado: conservar id y moves originales en Redux,
        // solo propagar cambio de HP. Evita corromper el save con id del rival.
        const usForDispatch = transformedId !== null ? { ...active, hp: us.hp } : us;
        dispatch(updatePokemon(usForDispatch));
        // FIX: cuando transformado, sincronizar PP de los movimientos copiados
        if (transformedId !== null) {
          setTransformedData((prev) => ({
            ...prev,
            [activePokemonIndex]: { id: transformedId, moves: us.moves },
          }));
        }

        // Actualizar lastPhysicalDamageRef si el rival nos ha pegado (para Counter)
        // En este bloque el JUGADOR ataca — no aplica para lastPhysicalDamage del jugador

        // Si el movimiento hace drain/recoil al jugador, propagar el HP ya calculado
        // (processMoveResult ya despacha 'us' con el HP correcto)

        // Registrar flinch si el resultado indica que el enemigo flinched
        if (result.flinch) enemyFlinchRef.current = true;

        // Aplicar condición de estado ANTES de elegir el mensaje
        const statusApplied = statusApply ? applyStatus(statusApply, isAttacking) : false;

        if (missed) {
          setAlertText(`¡${activeMetadata.name.toUpperCase()} falló!`);
        } else if (isTransform) {
          // Copiar ID, movimientos (PP:5) y stat stages del rival
          setTransformedData((prev) => ({
            ...prev,
            [activePokemonIndex]: {
              id: them.id,
              moves: them.moves.map((m) => ({ id: m, pp: 5 })),
            },
          }));
          setPlayerStages({ ...enemyStages });
          setAlertText(`¡${activeMetadata.name.toUpperCase()} se transformó!`);
          setStage(17);
        } else if (statChange) {
          applyStatChange(statChange, isAttacking);
          setStage(17);
        } else if (critical) {
          setAlertText(`¡Golpe crítico!`);
          setStage(17);
        } else if (superEffective) {
          setAlertText(`¡Es muy efectivo!`);
          setStage(17);
        } else if (notVeryEffective) {
          setAlertText(`No es muy efectivo...`);
          setStage(17);
        } else if (statusApplied) {
          // Mensaje ya fijado por applyStatus
          setStage(17);
        } else {
          setStage(17);
        }
      }, ATTACK_ANIMATION);
    }

    if (!isAttacking) {
      if (moveId) {
        const moveDataAnim = getMoveMetadata(moveId);
        setMoveAnim({
          moveId,
          target: "player",
          damageClass: moveDataAnim?.damageClass ?? "physical",
        });
      }
      setAlertText(
        `¡${enemyMetadata.name.toUpperCase()} rival usó ${moveName.toUpperCase()}!`
      );

      setStage(18);
      setTimeout(() => {
        dispatch(updatePokemonEncounter(them));
        // Cuando transformado: conservar id y moves originales, solo propagar HP.
        const usForDispatch = transformedId !== null ? { ...active, hp: us.hp } : us;
        dispatch(updatePokemon(usForDispatch));

        // Registrar daño físico recibido por el jugador (para Counter en siguiente turno)
        const movedUsed = getMoveMetadata(result.moveName) ?? getMoveMetadata("pound");
        if (movedUsed && movedUsed.damageClass === "physical" && us.hp < active.hp) {
          lastPhysicalDamageRef.current = active.hp - us.hp;
        }

        // Leech Seed del jugador: el rival drena al jugador si tiene seed
        if (playerLeechSeededRef.current && us.hp > 0) {
          const seedDmg = Math.max(1, Math.floor(getPokemonStats(us.id, us.level).hp / 16));
          const newPlayerHp = Math.max(0, us.hp - seedDmg);
          const newEnemyHp  = Math.min(getPokemonStats(them.id, them.level).hp, them.hp + seedDmg);
          dispatch(updatePokemon({ ...(transformedId !== null ? { ...active, hp: us.hp } : us), hp: newPlayerHp }));
          dispatch(updatePokemonEncounter({ ...them, hp: newEnemyHp }));
        }

        // Registrar flinch del jugador si el rival le golpea con flinch
        if (result.flinch) playerFlinchRef.current = true;

        // Aplicar condición de estado ANTES de elegir el mensaje
        const statusApplied = statusApply ? applyStatus(statusApply, isAttacking) : false;

        if (missed) {
          setAlertText(`¡${enemyMetadata.name.toUpperCase()} rival falló!`);
        } else if (isTransform) {
          // El enemigo se transforma en el pokémon activo del jugador
          const playerMoveIds = active.moves.map((m) => m.id);
          dispatch(updatePokemonEncounter({ ...them, id: active.id, moves: playerMoveIds }));
          setEnemyStages({ ...playerStages });
          setAlertText(`¡${enemyMetadata.name.toUpperCase()} rival se transformó!`);
          setStage(19);
        } else if (statChange) {
          applyStatChange(statChange, isAttacking);
          setStage(19);
        } else if (critical) {
          setAlertText(`¡Golpe crítico!`);
          setStage(19);
        } else if (superEffective) {
          setAlertText(`¡Es muy efectivo!`);
          setStage(19);
        } else if (notVeryEffective) {
          setAlertText(`No es muy efectivo...`);
          setStage(19);
        } else if (statusApplied) {
          // Mensaje ya fijado por applyStatus
          setStage(19);
        } else {
          setStage(19);
        }
      }, ATTACK_ANIMATION);
    }

    setTimeout(() => {
      setAlertText(null);
      setMoveAnim(null);
    }, ATTACK_ANIMATION + 1000);

    return { us, them };
  };

  // ── Helper: daño por veneno/quemadura al final del turno ─────────────────
  const applyEndOfTurnStatus = (
    currentUs: PokemonInstance,
    currentThem: PokemonEncounterType
  ) => {
    const pStatus = playerStatusRef.current;
    const eStatus = enemyStatusRef.current;
    let newUsHp   = currentUs.hp;
    let newThemHp = currentThem.hp;
    let hasMsg    = false;

    if (pStatus && (pStatus.type === "poison" || pStatus.type === "badly-poisoned" || pStatus.type === "burn")) {
      const maxHp  = getPokemonStats(currentUs.id, currentUs.level).hp;
      const counter = pStatus.type === "badly-poisoned" ? pStatus.turns : 1;
      const dmg    = Math.max(1, Math.floor(maxHp * counter / 16));
      newUsHp      = Math.max(0, newUsHp - dmg);
      dispatch(updatePokemon({ ...currentUs, hp: newUsHp }));
      if (pStatus.type === "badly-poisoned") {
        const upd = { ...pStatus, turns: pStatus.turns + 1 };
        setPlayerStatus(upd);
        playerStatusRef.current = upd;
      }
      const what = pStatus.type === "burn" ? "la quemadura" : "el veneno";
      setAlertText(`¡${activeMetadata.name.toUpperCase()} sufre por ${what}!`);
      hasMsg = true;
    }

    if (eStatus && (eStatus.type === "poison" || eStatus.type === "badly-poisoned" || eStatus.type === "burn")) {
      const maxHp  = getPokemonStats(currentThem.id, currentThem.level).hp;
      const counter = eStatus.type === "badly-poisoned" ? eStatus.turns : 1;
      const dmg    = Math.max(1, Math.floor(maxHp * counter / 16));
      newThemHp    = Math.max(0, newThemHp - dmg);
      dispatch(updatePokemonEncounter({ ...currentThem, hp: newThemHp }));
      if (eStatus.type === "badly-poisoned") {
        const upd = { ...eStatus, turns: eStatus.turns + 1 };
        setEnemyStatus(upd);
        enemyStatusRef.current = upd;
      }
      const what = eStatus.type === "burn" ? "la quemadura" : "el veneno";
      setAlertText(`¡${enemyMetadata.name.toUpperCase()} rival sufre por ${what}!`);
      hasMsg = true;
    }

    // Drenadoras en el enemigo: le quita PS y cura al jugador
    if (enemyLeechSeededRef.current && newThemHp > 0) {
      const seedDmg = Math.max(1, Math.floor(getPokemonStats(currentThem.id, currentThem.level).hp / 16));
      newThemHp     = Math.max(0, newThemHp - seedDmg);
      newUsHp       = Math.min(getPokemonStats(currentUs.id, currentUs.level).hp, newUsHp + seedDmg);
      dispatch(updatePokemonEncounter({ ...currentThem, hp: newThemHp }));
      dispatch(updatePokemon({ ...currentUs, hp: newUsHp }));
      setAlertText(`¡${enemyMetadata.name.toUpperCase()} rival pierde PS por Drenadoras!`);
      hasMsg = true;
    }

    // Drenadoras en el jugador: le quita PS y cura al enemigo
    if (playerLeechSeededRef.current && newUsHp > 0) {
      const seedDmg = Math.max(1, Math.floor(getPokemonStats(currentUs.id, currentUs.level).hp / 16));
      newUsHp       = Math.max(0, newUsHp - seedDmg);
      newThemHp     = Math.min(getPokemonStats(currentThem.id, currentThem.level).hp, newThemHp + seedDmg);
      dispatch(updatePokemon({ ...currentUs, hp: newUsHp }));
      dispatch(updatePokemonEncounter({ ...currentThem, hp: newThemHp }));
      setAlertText(`¡${activeMetadata.name.toUpperCase()} pierde PS por Drenadoras!`);
      hasMsg = true;
    }

    // Limpiar flinch al inicio del próximo turno
    enemyFlinchRef.current  = false;
    playerFlinchRef.current = false;

    setTimeout(() => {
      setAlertText(null);
      if (newUsHp <= 0)   setStage(24);
      else if (newThemHp <= 0) setStage(20);
      else setStage(11);
    }, hasMsg ? 1000 : 0);
  };

  const processBattle = (attackId: string) => {
    const activeMove = getMoveMetadata(attackId);
    const enemyMove  = getMoveMetadata(getRandomEnemyMove());

    const activeMovesFirst = getActiveMovesFirst(activeMove, enemyMove);
    const stagesSnapshot   = { us: playerStages, them: enemyStages };

    // Si el jugador está transformado, usar el ID/moves del transformado para los cálculos
    const effectivePlayer =
      transformedId !== null
        ? { ...active, id: transformedId, moves: transformedMoves }
        : active;

    // ── Helper: comprobar si un pokémon debe saltar su turno ─────────────
    const checkSkipTurn = (isPlayer: boolean): boolean => {
      // Flinch tiene prioridad sobre estados (se consume al comprobar)
      if (isPlayer && playerFlinchRef.current) {
        playerFlinchRef.current = false;
        setAlertText(`¡${activeMetadata.name.toUpperCase()} no puede moverse!`);
        return true;
      }
      if (!isPlayer && enemyFlinchRef.current) {
        enemyFlinchRef.current = false;
        return true; // rival flincheó — sin mensaje visible
      }

      const status    = isPlayer ? playerStatusRef.current : enemyStatusRef.current;
      if (!status) return false;

      type BT = { type: string; turns: number };
      const setStatus = isPlayer
        ? (s: BT | null) => { setPlayerStatus(s as typeof playerStatus); playerStatusRef.current = s as typeof playerStatus; }
        : (s: BT | null) => { setEnemyStatus(s as typeof enemyStatus);   enemyStatusRef.current  = s as typeof enemyStatus; };

      const name = isPlayer
        ? activeMetadata.name.toUpperCase()
        : enemyMetadata.name.toUpperCase() + " rival";

      if (status.type === "sleep") {
        const newTurns = status.turns - 1;
        if (newTurns <= 0) {
          setStatus(null);
          setAlertText(`¡${name} se despertó!`);
          return false; // se despertó, puede moverse este turno
        }
        setStatus({ ...status, turns: newTurns });
        setAlertText(`¡${name} está dormido...!`);
        return true;
      }
      if (status.type === "freeze") {
        if (Math.random() < 0.20) {
          setStatus(null);
          setAlertText(`¡${name} se descongeló!`);
          return false;
        }
        setAlertText(`¡${name} está congelado!`);
        return true;
      }
      if (status.type === "paralysis" && Math.random() < 0.25) {
        setAlertText(`¡${name} está paralizado! ¡No puede moverse!`);
        return true;
      }
      return false;
    };

    // ── Jugador mueve primero ─────────────────────────────────────────────
    if (activeMovesFirst) {
      if (checkSkipTurn(true)) {
        // Jugador salta turno — mostrar mensaje, luego ataca el rival
        setStage(15);
        setTimeout(() => {
          setAlertText(null);
          if (checkSkipTurn(false)) {
            // Ambos saltan
            setStage(18);
            setTimeout(() => {
              setAlertText(null);
              applyEndOfTurnStatus(effectivePlayer, enemy);
            }, ATTACK_ANIMATION);
          } else {
            const { us: usNew } = processMoveResult(
              processMove(effectivePlayer, enemy, enemyMove.id, false, stagesSnapshot, {
                lastPhysicalDamageTaken: lastPhysicalDamageRef.current,
                isTargetSleeping: playerStatusRef.current?.type === "sleep",
              }),
              false,
              enemyMove.id
            );
            setTimeout(() => {
              if (usNew.hp <= 0) setStage(24);
              else applyEndOfTurnStatus(usNew, enemy);
            }, ATTACK_ANIMATION + 1000);
          }
        }, ATTACK_ANIMATION);
      } else {
        // Jugador ataca normalmente
        const { us, them } = processMoveResult(
          processMove(effectivePlayer, enemy, attackId, true, stagesSnapshot, {
            lastPhysicalDamageTaken: lastPhysicalDamageRef.current,
            isTargetSleeping: enemyStatusRef.current?.type === "sleep",
          }),
          true,
          attackId
        );
        setTimeout(() => {
          if (them.hp <= 0) {
            setStage(20);
          } else if (us.hp <= 0) {
            setStage(24);
          } else {
            if (checkSkipTurn(false)) {
              // Rival salta turno
              setStage(18);
              setTimeout(() => {
                setAlertText(null);
                applyEndOfTurnStatus(us, them);
              }, ATTACK_ANIMATION);
            } else {
              const { us: usNew } = processMoveResult(
                processMove(us, them, enemyMove.id, false, stagesSnapshot),
                false,
                enemyMove.id
              );
              setTimeout(() => {
                if (usNew.hp <= 0) setStage(24);
                else applyEndOfTurnStatus(usNew, them);
              }, ATTACK_ANIMATION + 1000);
            }
          }
        }, ATTACK_ANIMATION + 1000);
      }
    }

    // ── Rival mueve primero ──────────────────────────────────────────────
    else {
      if (checkSkipTurn(false)) {
        // Rival salta turno — mostrar mensaje, luego ataca el jugador
        setStage(18);
        setTimeout(() => {
          setAlertText(null);
          if (checkSkipTurn(true)) {
            // Ambos saltan
            setStage(15);
            setTimeout(() => {
              setAlertText(null);
              applyEndOfTurnStatus(effectivePlayer, enemy);
            }, ATTACK_ANIMATION);
          } else {
            const { us: playerAft, them: enemyAft } = processMoveResult(
              processMove(effectivePlayer, enemy, attackId, true, stagesSnapshot, {
                lastPhysicalDamageTaken: lastPhysicalDamageRef.current,
                isTargetSleeping: enemyStatusRef.current?.type === "sleep",
              }),
              true,
              attackId
            );
            setTimeout(() => {
              if (enemyAft.hp <= 0) setStage(20);
              else if (playerAft.hp <= 0) setStage(24);
              else applyEndOfTurnStatus(playerAft, enemyAft);
            }, ATTACK_ANIMATION + 1000);
          }
        }, ATTACK_ANIMATION);
      } else {
        // Rival ataca normalmente
        const { us, them } = processMoveResult(
          processMove(effectivePlayer, enemy, enemyMove.id, false, stagesSnapshot, {
            lastPhysicalDamageTaken: lastPhysicalDamageRef.current,
            isTargetSleeping: playerStatusRef.current?.type === "sleep",
          }),
          false,
          enemyMove.id
        );
        setTimeout(() => {
          // BUG FIX: if the enemy self-destructed, it has 0 HP — player wins
          if (them.hp <= 0) {
            setStage(20);
            return;
          }
          if (us.hp <= 0) {
            setStage(24);
          } else {
            if (checkSkipTurn(true)) {
              // Jugador salta turno
              setStage(15);
              setTimeout(() => {
                setAlertText(null);
                applyEndOfTurnStatus(us, them);
              }, ATTACK_ANIMATION);
            } else {
              const { us: playerAfterAttack, them: themAfterAttack } = processMoveResult(
                processMove(us, them, attackId, true, stagesSnapshot, {
                  lastPhysicalDamageTaken: lastPhysicalDamageRef.current,
                  isTargetSleeping: enemyStatusRef.current?.type === "sleep",
                }),
                true,
                attackId
              );
              setTimeout(() => {
                if (themAfterAttack.hp <= 0) setStage(20);
                else if (playerAfterAttack.hp <= 0) setStage(24);
                else applyEndOfTurnStatus(playerAfterAttack, themAfterAttack);
              }, ATTACK_ANIMATION + 1000);
            }
          }
        }, ATTACK_ANIMATION + 1000);
      }
    }
  };

  const leftImage = () => {
    if (stage <= 3) return playerBack;
    if (stage === 46) return playerBack;
    if (stage === 48) return playerBack;
    if (isThrowingEnemyPokeball && trainerPokemonIndex === 0) return playerBack;
    if (stage === 5) return ball1;
    if (stage === 6) return ball2;
    if (stage === 7) return ball3;
    if (stage === 8) return ball4;
    if (stage === 9) return ball5;
    if (stage >= 10) {
      if (transformedId !== null) {
        return getPokemonMetadata(transformedId)?.images.back ?? activeMetadata.images.back;
      }
      return activeMetadata.images.back;
    }
  };

  const rightImage = () => {
    if (stage === 34) return ball1;
    if (stage === 35) return ball2;
    if (stage === 36) return ball3;
    if (stage === 37) return ball4;
    if (stage === 38) return ball5;
    if (stage === 39) return ballIdle;
    if (stage === 40) return ballLeft;
    if (stage === 41) return ballRight;
    if (stage === 45) return ballRight;
    if (stage < 3 && isTrainer) return trainer?.npc.portrait;
    if (stage === 46) return trainer?.npc.portrait;
    if (stage === 51) return trainer?.npc.portrait;
    if (stage === 52) return trainer?.npc.portrait;
    return enemyMetadata.images.front;
  };

  return (
    <>
      {stage === 0 && (
        <>
          <RightSide />
          <LeftSide />
        </>
      )}
      {stage >= 1 && (
        <>
          <StyledPokemonEncounter>
            <Row
              style={{ opacity: [20, 21, 22, 50].includes(stage) ? "0" : "1" }}
            >
              <LeftInfoSection
                style={{
                  opacity:
                    stage >= 3 &&
                    ![46, 51, 52].includes(stage) &&
                    !isThrowingEnemyPokeball
                      ? "1"
                      : "0",
                }}
              >
                <Name>{enemyMetadata.name}</Name>
                <Level>{`:L${enemy.level}`}</Level>
                <HealthBarContainer>
                  <HealthBar
                    big
                    currentHealth={enemy.hp}
                    maxHealth={enemyStats.hp}
                  />
                </HealthBarContainer>
                <Corner src={corner} />
              </LeftInfoSection>
              <ImageContainer $flashing={stage === 17 && moveAnim?.damageClass !== "status"}>
                <AttackRight $attacking={stage === 18 && moveAnim?.damageClass === "physical"}>
                  <ChangeEnemyPokemon $changing={[46].includes(stage)}>
                    <RightImage src={rightImage()} />
                  </ChangeEnemyPokemon>
                </AttackRight>
                <MoveAnimation
                  moveId={moveAnim?.moveId ?? null}
                  active={stage === 15 && moveAnim?.target === "enemy"}
                  fromDirection="left"
                />
              </ImageContainer>
            </Row>
            <Row
              style={{ opacity: [24, 26, 27, 28].includes(stage) ? "0" : "1" }}
            >
              <ImageContainer $flashing={stage === 19 && moveAnim?.damageClass !== "status"}>
                <AttackLeft $attacking={stage === 15 && moveAnim?.damageClass === "physical"}>
                  <ChangePokemon $changing={[3, 25].includes(stage)}>
                    <LeftImage src={leftImage()} />
                  </ChangePokemon>
                </AttackLeft>
                <MoveAnimation
                  moveId={moveAnim?.moveId ?? null}
                  active={stage === 18 && moveAnim?.target === "player"}
                  fromDirection="right"
                />
              </ImageContainer>
              <RightInfoSection
                style={{
                  opacity:
                    stage >= 11 &&
                    ![46, 48].includes(stage) &&
                    !isThrowingEnemyPokeball
                      ? "1"
                      : "0",
                }}
              >
                <Name>{activeMetadata.name}</Name>
                <Level>{`:L${active.level}`}</Level>
                <HealthBarContainer>
                  <HealthBar
                    big
                    currentHealth={active.hp}
                    maxHealth={activeStats.hp}
                  />
                </HealthBarContainer>
                <Health>{`${active.hp}/${activeStats.hp}`}</Health>
                <CornerContainer>
                  <CornerRight src={corner} />
                </CornerContainer>
              </RightInfoSection>
            </Row>
          </StyledPokemonEncounter>
          <TextContainer>
            <Frame
              wide
              tall
              flashing={
                [
                  2, 20, 21, 22, 24, 26, 27, 29, 30, 31, 32, 42, 43, 44, 45, 48,
                  49, 50, 51, 52, 53,
                ].includes(stage) || !!clickableNotice
              }
            >
              {text()}
            </Frame>
          </TextContainer>
          <Menu
            compact
            show={stage === 11 && !clickableNotice}
            disabled={itemMenuOpen || startMenuOpen}
            menuItems={[
              {
                label: "Luchar",
                action: () => setStage(14),
              },
              {
                pokemon: true,
                label: "PKMN",
                action: () => setStage(13),
              },
              {
                label: "Objeto",
                action: () => dispatch(showItemsMenu()),
              },
              {
                label: "Huir",
                action: () => {
                  if (isTrainer) {
                    setClickableNotice("No puedes huir de un combate contra entrenador.");
                  } else {
                    setStage(12);
                  }
                },
              },
            ]}
            noExit
            close={() => {}}
            bottom="0"
            right="0"
          />
          {stage === 13 && (
            <PokemonList
              close={() => setStage(11)}
              switchAction={(index) => {
                dispatch(setActivePokemon(index));
                setInvolvedPokemon([...involvedPokemon, index]);
                throwPokeball();
              }}
            />
          )}
          <MoveSelect
            show={stage === 14}
            select={(move: string) => processBattle(move)}
            close={() => setStage(11)}
            overrideMoves={transformedId !== null ? transformedMoves : undefined}
          />
          {stage === 25 && (
            <PokemonList
              text="¿A cuál POKéMON mandas?"
              close={() => {}}
              switchAction={(index) => {
                if (pokemon[index].hp <= 0) return;
                dispatch(setActivePokemon(index));
                setInvolvedPokemon([...involvedPokemon, index]);
                throwPokeball();
              }}
            />
          )}
          <Menu
            noExitOption
            disabled={startMenuOpen}
            padding={isMobile ? "100px" : "40vw"}
            show={stage === 33}
            menuItems={[
              ...processingPokemon.moves.map((m) => {
                const pokemonForLearn33 = pendingLevelRef.current !== null
                  ? { ...processingPokemon, level: pendingLevelRef.current }
                  : processingPokemon;
                const newMove = getLearnedMove(pokemonForLearn33);
                if (!newMove)
                  return {
                    label: "Error",
                    action: () => {},
                  };
                const item: MenuItemType = {
                  label: (getMoveMetadata(m.id)?.name ?? m.id).toUpperCase(),
                  action: () => {
                    endEncounter_();
                    dispatch(
                      updateSpecificPokemon({
                        index: involvedPokemon[processingInvolvedPokemon],
                        pokemon: {
                          ...processingPokemon,
                          moves: [
                            ...processingPokemon.moves.filter(
                              (move) => move.id !== m.id
                            ),
                            newMove,
                          ],
                        },
                      })
                    );
                  },
                };
                return item;
              }),
              {
                label: "NO APRENDER",
                action: () => {
                  endEncounter_();
                },
              },
            ]}
            close={() => endEncounter_()}
            bottom="0"
            right="0"
          />
          <BlackOverlay style={{ opacity: stage === 28 ? "1" : "0" }} />
        </>
      )}
    </>
  );
};

export default PokemonEncounter;
