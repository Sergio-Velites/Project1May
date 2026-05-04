/**
 * LabPokeball — Pokéballs interactivas del laboratorio (starter choice).
 *
 * Muestra 3 pokéballs en la mesa del lab. Al pulsar A frente a una,
 * abre el modal de selección (LabPokeballModal) vía Redux.
 */

import { useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  selectCompletedQuests,
  selectDirection,
  selectMapId,
  selectPokemon,
  selectPos,
} from "../state/gameSlice";
import { openPokeballCard, showTextThenAction } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { MapId } from "../maps/map-types";
import { directionModifier } from "../app/map-helper";
import PixelImage from "../styles/PixelImage";
import { xToPx, yToPx } from "../app/position-helper";
import pokeball from "../assets/misc/pokeball.png";

// ── Starters config ────────────────────────────────────────────────────────
const STARTERS = [
  { id: 1,  pos: { x: 6, y: 3 }, moveId: "tackle",  movePp: 35, move2Id: "growl",     move2Pp: 40 },
  { id: 4,  pos: { x: 7, y: 3 }, moveId: "scratch", movePp: 35, move2Id: "growl",     move2Pp: 40 },
  { id: 7,  pos: { x: 8, y: 3 }, moveId: "tackle",  movePp: 35, move2Id: "tail-whip", move2Pp: 30 },
];

// The quest ID we use to track each starter being taken
const starterQuestId = (pokemonId: number) =>
  `lab-starter-taken-${pokemonId}`;

// ── Styled ────────────────────────────────────────────────────────────────
// Coordenadas mundo (iguales que Trainer.tsx e Item.tsx).
// La pokéball se renderiza dentro de BackgroundContainer, que se
// desplaza con el mapa, por lo que queda fija sobre la mesa.
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

// ── Single pokéball component ──────────────────────────────────────────────
const SingleBall = ({
  starter,
}: {
  starter: typeof STARTERS[0];
}) => {
  const dispatch = useDispatch();
  const completedQuests = useSelector(selectCompletedQuests);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const teamPokemon = useSelector(selectPokemon);

  const questId = starterQuestId(starter.id);
  const isCollected = completedQuests.includes(questId);

  const isInFront = useCallback((): boolean => {
    if (mapId !== MapId.PalletTownLab) return false;
    const mod = directionModifier(facing);
    return (
      pos.x + mod.x === starter.pos.x &&
      pos.y + mod.y === starter.pos.y
    );
  }, [pos, facing, mapId, starter.pos]);

  useEvent(Event.A, useCallback(() => {
    if (isCollected) return;
    if (mapId !== MapId.PalletTownLab) return;
    if (!isInFront()) return;

    // Already has at least one pokémon from lab — "borracho" message then open card
    if (teamPokemon.length > 0) {
      dispatch(showTextThenAction({
        text: [
          "No debería ser tan codicioso,",
          "aunque parece que el Profesor va bien borracho,",
          "que demonios...",
        ],
        action: () => dispatch(openPokeballCard(starter.id)),
      }));
      return;
    }

    dispatch(openPokeballCard(starter.id));
  }, [isCollected, mapId, teamPokemon, isInFront, dispatch, starter.id]));

  if (isCollected) return null;

  return (
    <StyledBall $x={starter.pos.x} $y={starter.pos.y}>
      <BallSprite src={pokeball} />
    </StyledBall>
  );
};

// ── Main component ──────────────────────────────────────────────────────────
const LabPokeballs = () => {
  const mapId = useSelector(selectMapId);

  if (mapId !== MapId.PalletTownLab) return null;

  return (
    <>
      {STARTERS.map((s) => (
        <SingleBall
          key={s.id}
          starter={s}
        />
      ))}
    </>
  );
};

export { STARTERS, starterQuestId };
export default LabPokeballs;
