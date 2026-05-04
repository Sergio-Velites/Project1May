/**
 * LabPokeball — Pokéballs interactivas del laboratorio (starter choice).
 *
 * Muestra 3 pokéballs en la mesa del lab. Al pulsar A frente a una:
 *  - Aparece cuadro con sprite del pokémon y confirmación Sí/No
 *  - Sí: añade el pokémon al equipo (o mensaje de equipo lleno)
 *  - No: cancela
 *  - Si ya tienes ≥1 pokémon y vuelves a coger una: mensaje de "profesor borracho"
 */

import { useState, useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  addPokemon,
  selectCompletedQuests,
  completeQuest,
  selectDirection,
  selectMapId,
  selectPokemon,
  selectPos,
  seePokemon,
  catchPokemonPokedex,
} from "../state/gameSlice";
import { showText, showTextThenAction } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { MapId } from "../maps/map-types";
import { directionModifier } from "../app/map-helper";
import usePokemonMetadata from "../app/use-pokemon-metadata";
import usePokemonStats from "../app/use-pokemon-stats";
import PixelImage from "../styles/PixelImage";
import { xToPx, yToPx } from "../app/position-helper";
import pokeball from "../assets/misc/pokeball.png";

// ── Starters config ────────────────────────────────────────────────────────
const STARTERS = [
  { id: 1,  pos: { x: 1, y: 2 }, moveId: "tackle",  movePp: 35, move2Id: "growl",     move2Pp: 40 },
  { id: 4,  pos: { x: 2, y: 2 }, moveId: "scratch", movePp: 35, move2Id: "growl",     move2Pp: 40 },
  { id: 7,  pos: { x: 3, y: 2 }, moveId: "tackle",  movePp: 35, move2Id: "tail-whip", move2Pp: 30 },
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
`;

const BallSprite = styled(PixelImage)`
  width: ${xToPx(1)};
`;

// Confirmation overlay
const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 500;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
`;

const Card = styled.div`
  background: var(--bg);
  border: 3px solid #181010;
  font-family: "PokemonGB", monospace;
  font-size: 7cqw;
  @media (min-width: 600px) { font-size: 1.8vh; }
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  gap: 6px;
  width: 80%;
  max-width: 240px;
`;

const PokemonSprite = styled(PixelImage)`
  width: 50%;
  image-rendering: pixelated;
`;

const CardText = styled.p`
  font-size: 0.85em;
  text-align: center;
  line-height: 1.6;
  margin: 0;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 12px;
  width: 100%;
`;

const Btn = styled.button<{ $active: boolean }>`
  flex: 1;
  font-family: "PokemonGB", monospace;
  font-size: 0.9em;
  padding: 4px 0;
  border: 2px solid #181010;
  background: ${(p) => (p.$active ? "#181010" : "var(--bg)")};
  color: ${(p) => (p.$active ? "var(--bg)" : "#181010")};
  cursor: pointer;
`;

// ── Single pokéball component ──────────────────────────────────────────────
const SingleBall = ({
  starter,
  onCollect,
}: {
  starter: typeof STARTERS[0];
  onCollect: (id: number) => void;
}) => {
  const dispatch = useDispatch();
  const completedQuests = useSelector(selectCompletedQuests);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const mapId = useSelector(selectMapId);
  const teamPokemon = useSelector(selectPokemon);

  const [showCard, setShowCard] = useState(false);
  const [btnIndex, setBtnIndex] = useState(0); // 0=Sí, 1=No

  const meta = usePokemonMetadata(starter.id);
  const stats = usePokemonStats(starter.id, 5);

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

  useEvent(Event.Up, useCallback(() => {
    if (!showCard) return;
    setBtnIndex(0);
  }, [showCard]));

  useEvent(Event.Down, useCallback(() => {
    if (!showCard) return;
    setBtnIndex(1);
  }, [showCard]));

  useEvent(Event.A, useCallback(() => {
    if (isCollected) return;
    if (mapId !== MapId.PalletTownLab) return;

    if (showCard) {
      if (btnIndex === 0) {
        // Sí: add pokémon
        if (teamPokemon.length >= 6) {
          setShowCard(false);
          dispatch(showText([
            "¡No tienes espacio en tu equipo POKEMON!",
          ]));
          return;
        }
        dispatch(addPokemon({
          id: starter.id,
          level: 5,
          xp: 0,
          hp: stats.hp,
          moves: [
            { id: starter.moveId, pp: starter.movePp },
            { id: starter.move2Id, pp: starter.move2Pp },
          ],
        }));
        dispatch(seePokemon(starter.id));
        dispatch(catchPokemonPokedex(starter.id));
        dispatch(completeQuest(questId));
        setShowCard(false);
        const name = meta?.name.toUpperCase() ?? "POKEMON";
        dispatch(showText([`¡${name} se ha unido a tu equipo!`]));
        onCollect(starter.id);
      } else {
        // No
        setShowCard(false);
      }
      return;
    }

    if (!isInFront()) return;

    // Already has at least one pokémon from lab — "borracho" message then show card
    if (teamPokemon.length > 0) {
      dispatch(showTextThenAction({
        text: [
          "No debería ser tan codicioso,",
          "aunque parece que el Profesor va bien borracho,",
          "que demonios...",
        ],
        action: () => setShowCard(true),
      }));
      return;
    }

    setShowCard(true);
    setBtnIndex(0);
  }, [isCollected, mapId, showCard, btnIndex, teamPokemon, isInFront, dispatch, starter, stats, meta, onCollect]));

  useEvent(Event.B, useCallback(() => {
    if (!showCard) return;
    setShowCard(false);
  }, [showCard]));

  if (isCollected) return null;

  return (
    <>
      <StyledBall $x={starter.pos.x} $y={starter.pos.y}>
        <BallSprite src={pokeball} />
      </StyledBall>

      {showCard && meta && (
        <Overlay>
          <Card>
            <PokemonSprite src={meta.images.front} alt={meta.name} />
            <CardText>
              ¿Quieres a {meta.name.toUpperCase()}{"\n"}como tu compañero?
            </CardText>
            <BtnRow>
              <Btn $active={btnIndex === 0} onClick={() => { setBtnIndex(0); }}>SÍ</Btn>
              <Btn $active={btnIndex === 1} onClick={() => { setBtnIndex(1); }}>NO</Btn>
            </BtnRow>
          </Card>
        </Overlay>
      )}
    </>
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
          onCollect={() => {}}
        />
      ))}
    </>
  );
};

export default LabPokeballs;
