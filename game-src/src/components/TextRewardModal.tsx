/**
 * TextRewardModal — modal de recompensa vinculada a un tile de texto.
 *
 * Se activa cuando `textRewardPending` está en el store (dispatch openTextReward).
 * Soporta dos tipos de recompensa:
 *   · "item"    → muestra nombre + cantidad y da el objeto al pulsar A (sin SÍ/NO).
 *   · "pokemon" → muestra tarjeta del pokémon con SÍ/NO como MapGiftModal.
 * Al aceptar: despacha addInventory/addPokemon + completeQuest(questId) y cierra.
 * Al rechazar (pokemon): cierra SIN completar la quest → el tile sigue disponible.
 */

import { useCallback, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  addInventory,
  addPokemon,
  completeQuest,
  selectPokemon,
} from "../state/gameSlice";
import {
  closeTextReward,
  selectTextRewardPending,
  showText,
} from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import usePokemonMetadata, {
  getPokemonMetadata,
} from "../app/use-pokemon-metadata";
import { getPokemonStats } from "../app/use-pokemon-stats";
import { getMoveMetadata } from "../app/use-move-metadata";
import useItemData from "../app/use-item-data";
import { MoveState } from "../state/state-types";
import PixelImage from "../styles/PixelImage";
import Arrow from "./Arrow";

// ── Helpers ──────────────────────────────────────────────────────────────

const computeInitialMoves = (id: number, level: number): MoveState[] => {
  const meta = getPokemonMetadata(id);
  const learned = meta.moves
    .filter((m) => m.levelLearnedAt <= level)
    .sort((a, b) => a.levelLearnedAt - b.levelLearnedAt);
  return learned.slice(-4).map((m) => ({
    id: m.name,
    pp: getMoveMetadata(m.name).pp || 0,
  }));
};

// ── Styled components ────────────────────────────────────────────────────

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

const RewardName = styled.p`
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

// ── Componente ────────────────────────────────────────────────────────────

const TextRewardModal = () => {
  const dispatch = useDispatch();
  const reward = useSelector(selectTextRewardPending);
  const teamPokemon = useSelector(selectPokemon);
  const itemData = useItemData();

  // Solo para type === "pokemon"
  const [btnIndex, setBtnIndex] = useState(0);
  const pokemonMeta = usePokemonMetadata(
    reward?.type === "pokemon" ? (reward.pokemonId ?? null) : null
  );

  const close = useCallback(() => {
    dispatch(closeTextReward());
    setBtnIndex(0);
  }, [dispatch]);

  // ── Handlers A (item) ─────────────────────────────────────────────────
  useEvent(
    Event.A,
    useCallback(() => {
      if (!reward) return;

      if (reward.type === "item") {
        const key = reward.itemKey;
        if (!key) { close(); return; }
        const amount = reward.amount ?? 1;
        dispatch(addInventory({ item: key, amount }));
        dispatch(completeQuest(reward.questId));
        close();
        const name = itemData[key]?.name ?? key;
        const msg = amount > 1 ? `¡Encontraste ${amount}x ${name}!` : `¡Encontraste ${name}!`;
        dispatch(showText([msg]));
        return;
      }

      // type === "pokemon"
      if (!pokemonMeta || reward.pokemonId === undefined) { close(); return; }

      if (btnIndex === 0) {
        // SÍ
        if (teamPokemon.length >= 6) {
          close();
          dispatch(showText(["¡No tienes espacio en tu equipo POKEMON!"]));
          return;
        }
        const stats = getPokemonStats(reward.pokemonId, reward.level ?? 5);
        dispatch(
          addPokemon({
            id: reward.pokemonId,
            level: reward.level ?? 5,
            xp: 0,
            hp: stats.hp,
            moves: computeInitialMoves(reward.pokemonId, reward.level ?? 5),
          })
        );
        dispatch(completeQuest(reward.questId));
        close();
        dispatch(showText([`¡${pokemonMeta.name.toUpperCase()} se ha unido a tu equipo!`]));
      } else {
        // NO — cierra SIN completar quest → tile sigue disponible
        close();
      }
    }, [reward, btnIndex, teamPokemon, pokemonMeta, itemData, dispatch, close])
  );

  useEvent(
    Event.Left,
    useCallback(() => {
      if (reward?.type === "pokemon") setBtnIndex(0);
    }, [reward])
  );

  useEvent(
    Event.Right,
    useCallback(() => {
      if (reward?.type === "pokemon") setBtnIndex(1);
    }, [reward])
  );

  useEvent(
    Event.B,
    useCallback(() => {
      if (!reward) return;
      // Para items no hay cancelación (B no hace nada)
      if (reward.type === "pokemon") close();
    }, [reward, close])
  );

  if (!reward) return null;

  // ── Render item ───────────────────────────────────────────────────────
  if (reward.type === "item") {
    const key = reward.itemKey;
    const name = key && itemData[key] ? itemData[key].name : "Objeto";
    const amount = reward.amount ?? 1;
    return (
      <Overlay>
        <Card>
          <RightCol>
            <RewardName>{name.toUpperCase()}</RewardName>
            <CardText>
              {amount > 1 ? `x${amount} ` : ""}¡Pulsa A para recogerlo!
            </CardText>
            <BtnRow style={{ justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Arrow menu show />
                <span style={{ fontFamily: "PokemonGB", fontSize: "0.9em" }}>A</span>
              </div>
            </BtnRow>
          </RightCol>
        </Card>
      </Overlay>
    );
  }

  // ── Render pokemon ────────────────────────────────────────────────────
  if (!pokemonMeta) return null;
  return (
    <Overlay>
      <Card>
        <PokemonSprite src={pokemonMeta.images.front} alt={pokemonMeta.name} />
        <RightCol>
          <RewardName>{pokemonMeta.name.toUpperCase()}</RewardName>
          <CardText>¿Llevar a {pokemonMeta.name.toUpperCase()}?</CardText>
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

export default TextRewardModal;
