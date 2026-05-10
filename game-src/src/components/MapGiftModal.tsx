/**
 * MapGiftModal — Modal de pokéball-regalo (screen coords).
 *
 * Activado por `openMapGift(gift)` desde `MapGift.tsx`. Renderizado fuera
 * de `BackgroundContainer` en `Game.tsx` para quedar centrado en pantalla.
 *
 * Calcula los movimientos iniciales del pokémon ofrecido tomando los últimos
 * 4 moves aprendidos a/o por debajo del nivel del regalo.
 */

import { useCallback, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  addPokemon,
  catchPokemonPokedex,
  completeQuest,
  seePokemon,
  selectPokemon,
} from "../state/gameSlice";
import {
  closeMapGift,
  selectMapGiftPending,
  showText,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import usePokemonMetadata, {
  getPokemonMetadata,
} from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { getMoveMetadata } from "../app/use-move-metadata";
import { MoveState } from "../state/state-types";
import PixelImage from "../styles/PixelImage";

// Calcula los movimientos iniciales para un pokémon de nivel `level`:
// los últimos 4 moves aprendidos cuyo `levelLearnedAt <= level`,
// ordenados por nivel ascendente (los más recientes al final).
const computeInitialMoves = (id: number, level: number): MoveState[] => {
  const meta = getPokemonMetadata(id);
  const learned = meta.moves
    .filter((m) => m.levelLearnedAt <= level)
    .sort((a, b) => a.levelLearnedAt - b.levelLearnedAt);
  const last4 = learned.slice(-4);
  return last4.map((m) => ({
    id: m.name,
    pp: getMoveMetadata(m.name).pp || 0,
  }));
};

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

const MapGiftModal = () => {
  const dispatch = useDispatch();
  const gift = useSelector(selectMapGiftPending);
  const teamPokemon = useSelector(selectPokemon);
  const [btnIndex, setBtnIndex] = useState(0);

  const meta = usePokemonMetadata(gift?.pokemonId ?? null);

  useEvent(
    Event.Left,
    useCallback(() => {
      if (!gift) return;
      setBtnIndex(0);
    }, [gift])
  );

  useEvent(
    Event.Right,
    useCallback(() => {
      if (!gift) return;
      setBtnIndex(1);
    }, [gift])
  );

  useEvent(
    Event.A,
    useCallback(() => {
      if (!gift || !meta) return;

      if (btnIndex === 0) {
        if (teamPokemon.length >= 6) {
          dispatch(closeMapGift());
          dispatch(showText(["¡No tienes espacio en tu equipo POKEMON!"]));
          return;
        }
        const stats = getPokemonStats(gift.pokemonId, gift.level);
        dispatch(
          addPokemon({
            id: gift.pokemonId,
            level: gift.level,
            xp: 0,
            hp: stats.hp,
            moves: computeInitialMoves(gift.pokemonId, gift.level),
          })
        );
        dispatch(seePokemon(gift.pokemonId));
        dispatch(catchPokemonPokedex(gift.pokemonId));
        dispatch(completeQuest(gift.questId));
        dispatch(closeMapGift());
        const name = meta.name.toUpperCase();
        dispatch(showText([`¡${name} se ha unido a tu equipo!`]));
      } else {
        dispatch(closeMapGift());
      }
      setBtnIndex(0);
    }, [gift, meta, btnIndex, teamPokemon, dispatch])
  );

  useEvent(
    Event.B,
    useCallback(() => {
      if (!gift) return;
      dispatch(closeMapGift());
      setBtnIndex(0);
    }, [gift, dispatch])
  );

  if (!gift || !meta) return null;

  return (
    <Overlay>
      <Card>
        <PokemonSprite src={meta.images.front} alt={meta.name} />
        <RightCol>
          <PokeName>{meta.name.toUpperCase()}</PokeName>
          <CardText>¿Llevar a {meta.name.toUpperCase()}?</CardText>
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

export default MapGiftModal;
