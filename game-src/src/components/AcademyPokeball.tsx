/**
 * AcademyPokeball — Pokéball de Ditto en la academia de la Ciudad Añil.
 *
 * Renderiza el sprite de pokéball en coordenadas mundo {x:2, y:4},
 * encima de la mesa junto al libro misterioso.
 * Al pulsar A desde {x:1, y:4} mirando derecha, abre el modal de
 * confirmación (AcademyPokeballModal) vía Redux.
 */

import { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCompletedQuests,
  selectDirection,
  selectMapId,
  selectPos,
} from "../state/gameSlice";
import { openAcademyPokeball, selectMenuOpen } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { MapId } from "../maps/map-types";
import { directionModifier } from "../app/map-helper";
import PixelImage from "../styles/PixelImage";
import { xToPx, yToPx } from "../app/position-helper";
import pokeball from "../assets/misc/pokeball.png";

const DITTO_QUEST_ID = "academy-ditto-taken";
const DITTO_POS = { x: 4, y: 4 };

const StyledBall = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  top: ${(p) => yToPx(p.$y)};
  left: ${(p) => xToPx(p.$x)};
  z-index: 50;
  transform: translateY(-20%);
`;

const BallSprite = styled(PixelImage)`
  width: ${xToPx(1)};
`;

const AcademyPokeball = () => {
  const dispatch = useDispatch();
  const completedQuests = useSelector(selectCompletedQuests);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const menuOpen = useSelector(selectMenuOpen);

  const isCollected = completedQuests.includes(DITTO_QUEST_ID);

  const isInFront = useCallback((): boolean => {
    if (mapId !== MapId.ViridianCityPokemonAcadamy) return false;
    const mod = directionModifier(facing);
    return (
      pos.x + mod.x === DITTO_POS.x &&
      pos.y + mod.y === DITTO_POS.y
    );
  }, [pos, facing, mapId]);

  useEvent(Event.A, useCallback(() => {
    if (menuOpen) return;
    if (isCollected) return;
    if (mapId !== MapId.ViridianCityPokemonAcadamy) return;
    if (!isInFront()) return;
    dispatch(openAcademyPokeball());
  }, [menuOpen, isCollected, mapId, isInFront, dispatch]));

  if (mapId !== MapId.ViridianCityPokemonAcadamy) return null;
  if (isCollected) return null;

  return (
    <StyledBall $x={DITTO_POS.x} $y={DITTO_POS.y}>
      <BallSprite src={pokeball} />
    </StyledBall>
  );
};

export { DITTO_QUEST_ID };
export default AcademyPokeball;
