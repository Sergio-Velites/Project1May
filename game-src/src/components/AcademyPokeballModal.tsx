/**
 * AcademyPokeballModal — Modal de Ditto en la academia (pantalla completa, screen coords).
 *
 * Se activa cuando `academyPokeballOpen` en uiSlice es true.
 * Renderizado FUERA del BackgroundContainer → siempre centrado en pantalla.
 * El movimiento queda congelado automáticamente gracias a que
 * `academyPokeballOpen` está incluido en `selectMenuOpen`.
 */

import { useState, useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  addPokemon,
  completeQuest,
  selectCompletedQuests,
  selectPokemon,
} from "../state/gameSlice";
import {
  closeAcademyPokeball,
  selectAcademyPokeballOpen,
  showText,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import usePokemonMetadata from "../app/use-pokemon-metadata";
import usePokemonStats from "../app/use-pokemon-stats";
import PixelImage from "../styles/PixelImage";
import { DITTO_QUEST_ID } from "./AcademyPokeball";

const DITTO_ID = 132;
const DITTO_LEVEL = 10;

// ── Styled (mismo patrón que LabPokeballModal) ─────────────────────────────
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
  font-size: 5cqw;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 5px;
  gap: 6px;
  width: 86%;
  max-width: 260px;
  box-sizing: border-box;
`;

const PokemonSprite = styled(PixelImage)`
  height: 14cqw;
  width: auto;
  max-width: 14cqw;
  image-rendering: pixelated;
  flex-shrink: 0;
`;

const RightCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const PokeName = styled.p`
  font-size: 1em;
  font-weight: bold;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardText = styled.p`
  font-size: 0.85em;
  line-height: 1.5;
  margin: 0;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
`;

const Btn = styled.button<{ $active: boolean }>`
  flex: 1;
  font-family: "PokemonGB", monospace;
  font-size: 0.9em;
  padding: 3px 0;
  border: 2px solid #181010;
  background: ${(p) => (p.$active ? "#181010" : "var(--bg)")};
  color: ${(p) => (p.$active ? "var(--bg)" : "#181010")};
  cursor: pointer;
`;

// ── Component ─────────────────────────────────────────────────────────────
const AcademyPokeballModal = () => {
  const dispatch = useDispatch();
  const open = useSelector(selectAcademyPokeballOpen);
  const completedQuests = useSelector(selectCompletedQuests);
  const teamPokemon = useSelector(selectPokemon);
  const [btnIndex, setBtnIndex] = useState(0); // 0=Sí, 1=No

  const meta = usePokemonMetadata(DITTO_ID);
  const stats = usePokemonStats(DITTO_ID, DITTO_LEVEL);

  useEvent(Event.Left, useCallback(() => {
    if (!open) return;
    setBtnIndex(0);
  }, [open]));

  useEvent(Event.Right, useCallback(() => {
    if (!open) return;
    setBtnIndex(1);
  }, [open]));

  useEvent(Event.A, useCallback(() => {
    if (!open) return;
    if (!meta || !stats) return;

    if (completedQuests.includes(DITTO_QUEST_ID)) {
      dispatch(closeAcademyPokeball());
      return;
    }

    if (btnIndex === 0) {
      // Sí
      if (teamPokemon.length >= 6) {
        dispatch(closeAcademyPokeball());
        dispatch(showText(["¡No tienes espacio en tu equipo POKEMON!"]));
        return;
      }
      dispatch(
        addPokemon({
          id: DITTO_ID,
          level: DITTO_LEVEL,
          xp: 0,
          hp: stats.hp,
          moves: [{ id: "transform", pp: 10 }],
        })
      );
      dispatch(completeQuest(DITTO_QUEST_ID));
      dispatch(closeAcademyPokeball());
      dispatch(showText(["¡DITTO se ha unido a tu equipo!"]));
    } else {
      // No
      dispatch(closeAcademyPokeball());
    }
  }, [open, btnIndex, meta, stats, completedQuests, teamPokemon, dispatch]));

  useEvent(Event.B, useCallback(() => {
    if (!open) return;
    dispatch(closeAcademyPokeball());
  }, [open, dispatch]));

  if (!open || !meta) return null;

  return (
    <Overlay>
      <Card>
        <PokemonSprite src={meta.images.front} alt={meta.name} />
        <RightCol>
          <PokeName>{meta.name.toUpperCase()}</PokeName>
          <CardText>¿Llevar a DITTO?</CardText>
          <BtnRow>
            <Btn $active={btnIndex === 0} onClick={() => setBtnIndex(0)}>
              SÍ
            </Btn>
            <Btn $active={btnIndex === 1} onClick={() => setBtnIndex(1)}>
              NO
            </Btn>
          </BtnRow>
        </RightCol>
      </Card>
    </Overlay>
  );
};

export default AcademyPokeballModal;
