/**
 * MapGift — Pokéballs-regalo declarativas en mundo (world coords).
 *
 * Lee `currentMap.gifts` y renderiza un sprite de pokéball por cada regalo
 * cuya `questId` no esté en `completedQuests`. Al pulsar A desde la posición
 * adyacente mirando al regalo, abre `MapGiftModal` vía Redux (`openMapGift`).
 *
 * Va dentro de `BackgroundContainer` en `Game.tsx`.
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
import { openMapGift, selectMenuOpen } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { directionModifier } from "../app/map-helper";
import PixelImage from "../styles/PixelImage";
import { xToPx, yToPx } from "../app/position-helper";
import pokeball from "../assets/misc/pokeball.png";
import mapData from "../maps/map-data";
import { SimpleGiftType } from "../maps/map-types";

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

const MapGift = () => {
  const dispatch = useDispatch();
  const completedQuests = useSelector(selectCompletedQuests);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const menuOpen = useSelector(selectMenuOpen);

  const currentMap = mapData[mapId];
  const gifts: SimpleGiftType[] = currentMap?.gifts ?? [];

  const visibleGifts = gifts.filter(
    (g) => !completedQuests.includes(g.questId)
  );

  useEvent(
    Event.A,
    useCallback(() => {
      if (menuOpen) return;
      const mod = directionModifier(facing);
      const targetX = pos.x + mod.x;
      const targetY = pos.y + mod.y;
      const gift = visibleGifts.find(
        (g) => g.pos.x === targetX && g.pos.y === targetY
      );
      if (gift) dispatch(openMapGift(gift));
    }, [menuOpen, pos, facing, visibleGifts, dispatch])
  );

  if (visibleGifts.length === 0) return null;

  return (
    <>
      {visibleGifts.map((g) => (
        <StyledBall
          key={`${mapId}-gift-${g.pos.x}-${g.pos.y}`}
          $x={g.pos.x}
          $y={g.pos.y}
        >
          <BallSprite src={pokeball} />
        </StyledBall>
      ))}
    </>
  );
};

export default MapGift;
