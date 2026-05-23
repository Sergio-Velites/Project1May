/**
 * CuttableTree — Árboles cortables con la MO Corte (HM01).
 *
 * Renderiza bush.png en world-coords para cada árbol no cortado aún.
 * Al pulsar A estando adyacente al árbol y teniendo un Pokémon con "cut",
 * muestra el texto de la MO, lanza la animación de corte y añade el questId
 * a completedQuests (persistente). Sin corte el tile bloquea el paso.
 *
 * Va DENTRO de BackgroundContainer en Game.tsx.
 */

import { useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  markTreeCut,
  selectDirection,
  selectMapId,
  selectPos,
  selectPokemon,
  selectSessionCutTrees,
} from "../state/gameSlice";
import {
  clearActiveCutTree,
  selectActiveCutTree,
  selectMenuOpen,
  setActiveCutTree,
  showTextThenAction,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { directionModifier } from "../app/map-helper";
import { xToPx, yToPx } from "../app/position-helper";
import mapData from "../maps/map-data";
import { CuttableTreeType } from "../maps/map-types";
import pokemonMetadata from "../app/pokemon-metadata";
import bushImg from "../assets/other/bush.png";

// ── Animaciones ──────────────────────────────────────────────────────────────

const cutLeft = keyframes`
  0%   { transform: translateX(0)    scaleY(1);   opacity: 1; }
  30%  { transform: translateX(-8%)  scaleY(1.1); opacity: 1; }
  100% { transform: translateX(-90%) scaleY(0.6); opacity: 0; }
`;

const cutRight = keyframes`
  0%   { transform: translateX(0)   scaleY(1);   opacity: 1; }
  30%  { transform: translateX(8%)  scaleY(1.1); opacity: 1; }
  100% { transform: translateX(90%) scaleY(0.6); opacity: 0; }
`;

const CUT_DURATION_MS = 480;

// ── Styled components ────────────────────────────────────────────────────────

const TreeWrapper = styled.div<{ $x: number; $y: number }>`
  position: absolute;
  top: ${(p) => yToPx(p.$y)};
  left: ${(p) => xToPx(p.$x)};
  width: ${xToPx(1)};
  height: ${yToPx(1)};
  z-index: 48;
  pointer-events: none;
`;

// Durante la animación renderizamos dos mitades con clip-path
const HalfLeft = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  image-rendering: pixelated;
  clip-path: inset(0 50% 0 0);
  animation: ${cutLeft} ${CUT_DURATION_MS}ms ease-in forwards;
`;

const HalfRight = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  image-rendering: pixelated;
  clip-path: inset(0 0 0 50%);
  animation: ${cutRight} ${CUT_DURATION_MS}ms ease-in forwards;
`;

const StaticImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: fill;
  image-rendering: pixelated;
`;

// ── Componente ───────────────────────────────────────────────────────────────

const CuttableTree = () => {
  const dispatch = useDispatch();
  const sessionCutTrees = useSelector(selectSessionCutTrees);
  const activeCutTree = useSelector(selectActiveCutTree);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const menuOpen = useSelector(selectMenuOpen);
  const pokemon = useSelector(selectPokemon);

  const currentMap = mapData[mapId];
  const trees: CuttableTreeType[] = currentMap?.cuttableTrees ?? [];

  const visibleTrees = trees.filter(
    (t) =>
      !sessionCutTrees.includes(t.questId) &&
      !(activeCutTree?.questId === t.questId)
  );

  useEvent(
    Event.A,
    useCallback(() => {
      if (menuOpen) return;

      const mod = directionModifier(facing);
      const targetX = pos.x + mod.x;
      const targetY = pos.y + mod.y;

      const tree = visibleTrees.find(
        (t) => t.pos.x === targetX && t.pos.y === targetY
      );
      if (!tree) return;

      // Buscar primer Pokémon del equipo con el movimiento "cut"
      const cutter = pokemon.find((p) =>
        p.moves?.some((m) => m.id === "cut")
      );

      if (!cutter) {
        // Sin Pokémon que sepa Corte: mensaje informativo
        dispatch(
          showTextThenAction({
            text: ["Necesitas la MO CORTE para esto."],
            action: () => {},
          })
        );
        return;
      }

      const cutterName = pokemonMetadata[cutter.id].name.toUpperCase();
      const { pos: { x, y }, questId } = tree;

      dispatch(
        showTextThenAction({
          text: [`¡${cutterName} usó CORTE!`],
          action: () => {
            dispatch(setActiveCutTree({ x, y, questId }));
            setTimeout(() => {
              dispatch(markTreeCut(questId));
              dispatch(clearActiveCutTree());
            }, CUT_DURATION_MS);
          },
        })
      );
    }, [menuOpen, pos, facing, visibleTrees, pokemon, dispatch])
  );

  return (
    <>
      {/* Árboles estáticos (aún no cortados, no animando) */}
      {visibleTrees.map((t) => (
        <TreeWrapper
          key={`tree-${mapId}-${t.pos.x}-${t.pos.y}`}
          $x={t.pos.x}
          $y={t.pos.y}
        >
          <StaticImg src={bushImg} alt="" />
        </TreeWrapper>
      ))}

      {/* Árbol en animación de corte */}
      {activeCutTree && (
        <TreeWrapper $x={activeCutTree.x} $y={activeCutTree.y}>
          <HalfLeft src={bushImg} alt="" />
          <HalfRight src={bushImg} alt="" />
        </TreeWrapper>
      )}
    </>
  );
};

export default CuttableTree;
