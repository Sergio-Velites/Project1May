import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  encounterPokemon,
  encounterTrainer,
  selectDefeatedTrainers,
  selectDirection,
  selectMap,
  selectMapId,
  selectName,
  selectPokemon,
  selectPokemonEncounter,
  selectPos,
  selectTrainerEncounter,
  setNpcFacing,
} from "../state/gameSlice";
import { useEffect, useState } from "react";
import {
  directionModifier,
  isTrainer,
  isTrainerEncounter,
} from "../app/map-helper";
import Frame from "./Frame";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import getPokemonEncounter from "../app/pokemon-encounter-helper";
import { showText, selectMenuOpen } from "../state/uiSlice";
import { Direction } from "../state/state-types";

const oppositeDirection = (dir: Direction): Direction => {
  if (dir === Direction.Up) return Direction.Down;
  if (dir === Direction.Down) return Direction.Up;
  if (dir === Direction.Left) return Direction.Right;
  return Direction.Left;
};

const StyledTrainerEncounter = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  z-index: 100;
`;

const TrainerEncounter = () => {
  const dispatch = useDispatch();
  const map = useSelector(selectMap);
  const pos = useSelector(selectPos);
  const encounter = useSelector(selectTrainerEncounter);
  const pokemonEncounter = useSelector(selectPokemonEncounter);
  const defeatedTrainers = useSelector(selectDefeatedTrainers);
  const direction = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);

  const [introIndex, setIntroIndex] = useState(-1);
  const playerName = useSelector(selectName);
  const menuOpen = useSelector(selectMenuOpen);
  const teamPokemon = useSelector(selectPokemon);

  const { trainers, walls, fences } = map;

  useEffect(() => {
    if (!trainers) return;

    const encounter_ = isTrainerEncounter(
      trainers,
      walls,
      fences,
      pos,
      defeatedTrainers,
      mapId
    );

    if (!encounter_) return;
    // No disparar encuentro si el trainer no tiene intro (NPC decorativo sin combate)
    if (!encounter_.intro || encounter_.intro.length === 0) return;
    dispatch(encounterTrainer(encounter_));
    setTimeout(() => {
      setIntroIndex(0);
    }, 500);
  }, [trainers, walls, fences, pos, dispatch, defeatedTrainers, mapId]);

  useEvent(Event.A, () => {
    // No interactuar con NPCs mientras hay texto u otro menú abierto.
    // Sin este guard, cada pulsación de A para avanzar texto volvería a
    // despachar showText() reiniciando el diálogo al inicio.
    if (menuOpen) return;
    const facingPos = directionModifier(direction);
    if (
      map.trainers &&
      isTrainer(map.trainers, pos.x + facingPos.x, pos.y + facingPos.y) &&
      !encounter
    ) {
      const trainer = map.trainers.find(
        (trainer) =>
          trainer.pos.x === pos.x + facingPos.x &&
          trainer.pos.y === pos.y + facingPos.y
      );
      if (!trainer) throw new Error("Trainer not found");
      // Si el trainer está oculto por condición, ignorar completamente la interacción
      if (trainer.hideCondition === "has-pokemon" && teamPokemon.length > 0) return;
      const trainerId = `${mapId}-${trainer.pos.x}-${trainer.pos.y}`;
      // Girar NPC hacia el jugador
      dispatch(setNpcFacing({ id: trainerId, direction: oppositeDirection(direction) }));
      if (defeatedTrainers.includes(trainerId)) {
        if (trainer.outtro && trainer.outtro.length > 0) {
          dispatch(showText(trainer.outtro));
        }
        return;
      }
      // NPC decorativo (intro vacío): mostrar outtro si existe, nunca iniciar batalla
      if (!trainer.intro || trainer.intro.length === 0) {
        if (trainer.outtro && trainer.outtro.length > 0) {
          dispatch(showText(trainer.outtro));
        }
        return;
      }
      dispatch(encounterTrainer(trainer));
      setTimeout(() => {
        setIntroIndex(0);
      }, 500);
    }

    if (!encounter || !!pokemonEncounter) return;

    if (introIndex === encounter.intro.length - 1) {
      setIntroIndex(-1);
      const pokemon_ = encounter.pokemon[0];
      dispatch(
        encounterPokemon(getPokemonEncounter(pokemon_.id, pokemon_.level))
      );
    } else {
      setIntroIndex(introIndex + 1);
    }
  });

  if (!trainers || !encounter || introIndex === -1) return null;

  const introText = (encounter.intro[introIndex] ?? "").replace("{name}", playerName);

  return (
    <StyledTrainerEncounter>
      <Frame wide tall flashing>
        {introText}
      </Frame>
    </StyledTrainerEncounter>
  );
};

export default TrainerEncounter;
