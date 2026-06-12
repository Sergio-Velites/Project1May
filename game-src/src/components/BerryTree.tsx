/**
 * BerryTree — Árboles de bayas (Gen II, Oro/Plata/Cristal).
 *
 * Renderiza un árbol pixel-art en world-coords por cada entrada de
 * `map.berryTrees`. El árbol bloquea el paso (ver map-helper/canWalk) y da
 * UNA baya al día: al pulsar A de frente se recoge `item` y se anota la fecha
 * en `berryTreesPicked` (persistido en el save). A medianoche (hora local del
 * dispositivo, igual que el reloj de Gen II) la baya rebrota.
 *
 * Va DENTRO de BackgroundContainer en Game.tsx (igual que CuttableTree).
 */

import { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  addInventory,
  pickBerryTree,
  selectBerryTreesPicked,
  selectDirection,
  selectMapId,
  selectPos,
} from "../state/gameSlice";
import { selectMenuOpen, showText, showTextThenAction } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { directionModifier } from "../app/map-helper";
import { xToPx, yToPx } from "../app/position-helper";
import mapData from "../maps/map-data";
import { BerryTreeType } from "../maps/map-types";
import useItemData from "../app/use-item-data";
import berryTreeImg from "../assets/other/berry_tree.png";

/** Fecha local "YYYY-M-D" — el árbol rebrota cuando cambia el día. */
const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const TreeWrapper = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  top: ${(p) => yToPx(p.$y)};
  left: ${(p) => xToPx(p.$x)};
  width: ${xToPx(1)};
  height: ${yToPx(1)};
  z-index: 48;
  pointer-events: none;
`;

const TreeImg = styled.img`
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
`;

const BerryTree = () => {
  const dispatch = useDispatch();
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const menuOpen = useSelector(selectMenuOpen);
  const picked = useSelector(selectBerryTreesPicked);
  const itemData = useItemData();

  const currentMap = mapData[mapId];
  const trees: BerryTreeType[] = currentMap?.berryTrees ?? [];

  const treeKey = (t: BerryTreeType) => `${mapId}-${t.pos.x}-${t.pos.y}`;
  const hasBerry = (t: BerryTreeType) => picked[treeKey(t)] !== todayKey();

  useEvent(
    Event.A,
    useCallback(() => {
      if (menuOpen) return;
      if (trees.length === 0) return;

      const mod = directionModifier(facing);
      const targetX = pos.x + mod.x;
      const targetY = pos.y + mod.y;

      const tree = trees.find(
        (t) => t.pos.x === targetX && t.pos.y === targetY
      );
      if (!tree) return;

      if (!hasBerry(tree)) {
        dispatch(
          showText([
            "Aquí no quedan bayas...",
            "Volverán a crecer mañana.",
          ])
        );
        return;
      }

      const itemName = itemData[tree.item]?.name ?? "BAYA";
      dispatch(
        showTextThenAction({
          text: [`¡Hay una ${itemName} en el árbol!`, `Recogiste la ${itemName}.`],
          action: () => {
            dispatch(addInventory({ item: tree.item, amount: 1 }));
            dispatch(pickBerryTree({ treeKey: treeKey(tree), date: todayKey() }));
          },
        })
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuOpen, pos, facing, trees, picked, dispatch, itemData])
  );

  return (
    <>
      {trees.map((t) => (
        <TreeWrapper
          key={`berry-${mapId}-${t.pos.x}-${t.pos.y}`}
          $x={t.pos.x}
          $y={t.pos.y}
        >
          <TreeImg src={berryTreeImg} alt="" />
        </TreeWrapper>
      ))}
    </>
  );
};

export default BerryTree;
