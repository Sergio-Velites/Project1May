/**
 * LabPokeballModal — Modal de selección de starter (renderiza en espacio pantalla).
 *
 * Se activa cuando `pokeballCardId` en uiSlice es distinto de null.
 * Está montado FUERA del BackgroundContainer (coordenadas de pantalla), por lo
 * que siempre queda centrado en la pantalla del Game Boy.
 * El movimiento del jugador queda congelado automáticamente gracias a que
 * `pokeballCardId !== null` está incluido en `selectMenuOpen`.
 */

import { useState, useCallback } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  addPokemon,
  completeQuest,
  selectCompletedQuests,
  selectPokemon,
  seePokemon,
  catchPokemonPokedex,
} from "../state/gameSlice";
import {
  closePokeballCard,
  selectPokeballCardId,
  showText,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import usePokemonMetadata from "../app/use-pokemon-metadata";
import usePokemonStats from "../app/use-pokemon-stats";
import PixelImage from "../styles/PixelImage";
import { STARTERS, starterQuestId } from "./LabPokeball";

// ── Styled ────────────────────────────────────────────────────────────────
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
  @media (min-width: 600px) {
    font-size: 1.8vh;
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
  gap: 4px;
  width: 80%;
  max-width: 240px;
  max-height: 92%;
  overflow-y: auto;
  box-sizing: border-box;
`;

const PokemonSprite = styled(PixelImage)`
  width: 32%;
  max-height: 28cqw;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
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

// ── Inner card for a specific starter ─────────────────────────────────────
const StarterCard = ({ pokemonId }: { pokemonId: number }) => {
  const dispatch = useDispatch();
  const completedQuests = useSelector(selectCompletedQuests);
  const teamPokemon = useSelector(selectPokemon);
  const [btnIndex, setBtnIndex] = useState(0); // 0=Sí, 1=No

  const starter = STARTERS.find((s) => s.id === pokemonId);
  const meta = usePokemonMetadata(pokemonId);
  const stats = usePokemonStats(pokemonId, 5);

  const questId = starterQuestId(pokemonId);

  // Left = Sí (index 0), Right = No (index 1)
  useEvent(
    Event.Left,
    useCallback(() => {
      setBtnIndex(0);
    }, [])
  );

  useEvent(
    Event.Right,
    useCallback(() => {
      setBtnIndex(1);
    }, [])
  );

  useEvent(
    Event.A,
    useCallback(() => {
      if (!starter || !meta || !stats) return;
      if (completedQuests.includes(questId)) {
        dispatch(closePokeballCard());
        return;
      }

      if (btnIndex === 0) {
        // Sí
        if (teamPokemon.length >= 6) {
          dispatch(closePokeballCard());
          dispatch(showText(["¡No tienes espacio en tu equipo POKEMON!"]));
          return;
        }
        dispatch(
          addPokemon({
            id: starter.id,
            level: 5,
            xp: 0,
            hp: stats.hp,
            moves: [
              { id: starter.moveId, pp: starter.movePp },
              { id: starter.move2Id, pp: starter.move2Pp },
            ],
          })
        );
        dispatch(seePokemon(starter.id));
        dispatch(catchPokemonPokedex(starter.id));
        dispatch(completeQuest(questId));
        dispatch(closePokeballCard());
        const name = meta.name.toUpperCase();
        dispatch(showText([`¡${name} se ha unido a tu equipo!`]));
      } else {
        // No
        dispatch(closePokeballCard());
      }
    }, [btnIndex, starter, meta, stats, completedQuests, questId, teamPokemon, dispatch])
  );

  useEvent(
    Event.B,
    useCallback(() => {
      dispatch(closePokeballCard());
    }, [dispatch])
  );

  if (!meta || !starter) return null;

  return (
    <Overlay>
      <Card>
        <PokemonSprite src={meta.images.front} alt={meta.name} />
        <CardText>
          ¿Quieres a {meta.name.toUpperCase()}
          {"\n"}como tu compañero?
        </CardText>
        <BtnRow>
          <Btn $active={btnIndex === 0} onClick={() => setBtnIndex(0)}>
            SÍ
          </Btn>
          <Btn $active={btnIndex === 1} onClick={() => setBtnIndex(1)}>
            NO
          </Btn>
        </BtnRow>
      </Card>
    </Overlay>
  );
};

// ── Main export ───────────────────────────────────────────────────────────
const LabPokeballModal = () => {
  const cardId = useSelector(selectPokeballCardId);
  if (cardId === null) return null;
  return <StarterCard pokemonId={cardId} />;
};

export default LabPokeballModal;
