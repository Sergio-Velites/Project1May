/**
 * Boulder — Rocas empujables con la MO Fuerza (HM04 / "strength").
 *
 * Renderiza cada roca del mapa en world-coords (dentro de BackgroundContainer)
 * en su posición ACTUAL (`boulderPositions[id]` si ya se ha empujado, o su
 * posición inicial). El empuje en sí lo gestionan los reducers de movimiento
 * de `gameSlice` (moveUp/Down/Left/Right) cuando la Fuerza está activada.
 *
 * Este componente solo se encarga de:
 *   1. Dibujar las rocas.
 *   2. Detectar A frente a una roca para ACTIVAR la Fuerza (estilo Gen I:
 *      hay que "usar FUERZA" una vez por mapa antes de poder empujar rocas).
 *
 * Fiel al original: si no hay ningún Pokémon que sepa Fuerza, la roca solo
 * muestra un mensaje informativo y bloquea el paso.
 *
 * Va DENTRO de BackgroundContainer en Game.tsx.
 */

import { useCallback } from "react";
import styled from "styled-components";
import boulderImg from "../assets/map/boulder-strength.png";
import { useDispatch, useSelector } from "react-redux";
import {
  selectBoulderPositions,
  selectDirection,
  selectMapId,
  selectPokemon,
  selectPos,
  selectStrengthActive,
  setStrengthActive,
} from "../state/gameSlice";
import {
  selectMenuOpen,
  showText,
  showTextThenAction,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { directionModifier } from "../app/map-helper";
import { xToPx, yToPx } from "../app/position-helper";
import mapData from "../maps/map-data";
import pokemonMetadata from "../app/pokemon-metadata";


const BoulderWrapper = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  top: ${(p) => yToPx(p.$y)};
  left: ${(p) => xToPx(p.$x)};
  width: ${xToPx(1)};
  height: ${yToPx(1)};
  z-index: 48;
  pointer-events: none;
  transition: top 0.15s steps(3, end), left 0.15s steps(3, end);
`;

const StaticImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: fill;
  image-rendering: pixelated;
`;

const Boulder = () => {
  const dispatch = useDispatch();
  const boulderPositions = useSelector(selectBoulderPositions);
  const strengthActive = useSelector(selectStrengthActive);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const menuOpen = useSelector(selectMenuOpen);
  const pokemon = useSelector(selectPokemon);

  const currentMap = mapData[mapId];
  const boulders = currentMap?.boulders ?? [];

  useEvent(
    Event.A,
    useCallback(() => {
      if (menuOpen) return;

      const mod = directionModifier(facing);
      const targetX = pos.x + mod.x;
      const targetY = pos.y + mod.y;

      // ¿Hay una roca en el tile de enfrente (en su posición actual)?
      const boulder = boulders.find((b) => {
        const cur = boulderPositions[b.id] ?? b.pos;
        return cur.x === targetX && cur.y === targetY;
      });
      if (!boulder) return;

      // Si ya está activada, recordatorio breve.
      if (strengthActive) {
        dispatch(showText(["Es una roca. ¡Empújala con FUERZA!"]));
        return;
      }

      // ¿Algún Pokémon del equipo conoce Fuerza?
      const strongMon = pokemon.find((p) =>
        p.moves?.some((m) => m.id === "strength")
      );

      if (!strongMon) {
        dispatch(
          showText([
            "¡Es una roca enorme!",
            "Quizá un POKéMON pueda moverla con FUERZA.",
          ])
        );
        return;
      }

      const monName = pokemonMetadata[strongMon.id].name.toUpperCase();
      dispatch(
        showTextThenAction({
          text: [`¡${monName} usó FUERZA!`, "¡Ahora se pueden mover rocas!"],
          action: () => {
            dispatch(setStrengthActive(true));
          },
        })
      );
    }, [
      menuOpen,
      pos,
      facing,
      boulders,
      boulderPositions,
      strengthActive,
      pokemon,
      dispatch,
    ])
  );

  return (
    <>
      {boulders.map((b) => {
        const cur = boulderPositions[b.id] ?? b.pos;
        return (
          <BoulderWrapper key={`boulder-${mapId}-${b.id}`} $x={cur.x} $y={cur.y}>
            <StaticImg src={boulderImg} alt="" />
          </BoulderWrapper>
        );
      })}
    </>
  );
};

export default Boulder;
