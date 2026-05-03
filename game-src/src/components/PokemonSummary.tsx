/**
 * PokemonSummary — Pantalla de datos del Pokémon al estilo Gen I (RBY).
 *
 * Página 1 — INFO:  sprite grande, nº, nombre, tipo, altura, PS actuales/máx
 * Página 2 — STATS: stats numéricos (PS / ATQ / DEF / VEL / ESP) + movimientos
 *
 * Navegación: A/B cierra, ←/→ cambia de página.
 */

import { useCallback } from "react";
import styled from "styled-components";
import { PokemonInstance } from "../state/state-types";
import usePokemonMetadata from "../app/use-pokemon-metadata";
import usePokemonStats from "../app/use-pokemon-stats";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import PixelImage from "../styles/PixelImage";
import HealthBar from "./HealthBar";
import { getMoveMetadata } from "../app/use-move-metadata";
import { useState } from "react";

// ── Layout ───────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 200;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  font-family: "PokemonGB";
  color: #181010;
  overflow: hidden;
`;

// ── Page 1 — INFO ────────────────────────────────────────────────────────────

const InfoPage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px 6px 2px;
`;

const TopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 4px;
`;

const SpriteBox = styled.div`
  border: 3px solid #181010;
  width: 44%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  flex-shrink: 0;
`;

const Sprite = styled(PixelImage)`
  width: 90%;
  height: 90%;
  object-fit: contain;
`;

const InfoRight = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Label = styled.p<{ $size?: string }>`
  font-size: ${(p) => p.$size ?? "7px"};
  line-height: 1.6;
  @media (min-width: 1000px) {
    font-size: ${(p) =>
      p.$size === "9px" ? "3.8vh" : p.$size === "8px" ? "3.3vh" : "2.8vh"};
  }
`;

const TypeBadge = styled.span`
  display: inline-block;
  border: 2px solid #181010;
  padding: 1px 4px;
  font-size: 6px;
  margin-right: 2px;
  text-transform: uppercase;
  @media (min-width: 1000px) {
    font-size: 2.5vh;
    border-width: 1px;
  }
`;

const Divider = styled.div`
  height: 2px;
  background: #181010;
  margin: 3px 0;
`;

const HpRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
`;

const HpNum = styled.p`
  font-size: 7px;
  white-space: nowrap;
  @media (min-width: 1000px) {
    font-size: 2.8vh;
  }
`;

const NavHint = styled.p`
  font-size: 6px;
  text-align: right;
  margin-top: auto;
  padding-top: 2px;
  @media (min-width: 1000px) {
    font-size: 2.3vh;
  }
`;

// ── Page 2 — STATS ───────────────────────────────────────────────────────────

const StatsPage = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 4px 6px 2px;
  gap: 2px;
`;

const StatsTitle = styled.p`
  font-size: 8px;
  text-align: center;
  margin-bottom: 2px;
  @media (min-width: 1000px) {
    font-size: 3.2vh;
  }
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #c8c8c8;
  padding: 1px 0;
`;

const StatName = styled.span`
  font-size: 6px;
  @media (min-width: 1000px) {
    font-size: 2.5vh;
  }
`;

const StatVal = styled.span`
  font-size: 7px;
  @media (min-width: 1000px) {
    font-size: 2.8vh;
  }
`;

const MovesSection = styled.div`
  margin-top: 4px;
`;

const MovesTitleRow = styled.p`
  font-size: 7px;
  margin-bottom: 2px;
  @media (min-width: 1000px) {
    font-size: 2.8vh;
  }
`;

const MoveRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1px 0;
  border-bottom: 1px dotted #aaa;
`;

const MoveName = styled.span`
  font-size: 6px;
  text-transform: uppercase;
  @media (min-width: 1000px) {
    font-size: 2.4vh;
  }
`;

const MovePP = styled.span`
  font-size: 6px;
  @media (min-width: 1000px) {
    font-size: 2.4vh;
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Altura en formato "X'YY" (décimas de metro → pies y pulgadas como Gen I) */
const fmtHeight = (dm: number): string => {
  const inches = Math.round((dm * 10) / 2.54);
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${String(inch).padStart(2, "0")}`;
};

/** Mapeo de tipo a nombre en español */
const TYPE_ES: Record<string, string> = {
  normal: "NORMAL", fire: "FUEGO", water: "AGUA", electric: "ELÉCT",
  grass: "PLANTA", ice: "HIELO", fighting: "LUCHA", poison: "VENENO",
  ground: "TIERRA", flying: "VOLAD", psychic: "PSÍQUI", bug: "BICHO",
  rock: "ROCA", ghost: "FANTAS", dragon: "DRAGÓN", dark: "SINIS",
  steel: "ACERO", fairy: "HADA",
};

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  pokemon: PokemonInstance;
  onClose: () => void;
}

const PokemonSummary = ({ pokemon, onClose }: Props) => {
  const [page, setPage] = useState<0 | 1>(0); // 0 = INFO, 1 = STATS
  const meta  = usePokemonMetadata(pokemon.id);
  const stats = usePokemonStats(pokemon.id, pokemon.level);

  const handleLeft = useCallback(() => setPage(0), []);
  const handleRight = useCallback(() => setPage(1), []);

  useEvent(Event.Left,  handleLeft);
  useEvent(Event.Right, handleRight);
  useEvent(Event.B,     onClose);
  // A también cierra (si estamos en página 0 ya no hay más que ver)
  useEvent(Event.A, useCallback(() => {
    if (page === 0) setPage(1);
    else onClose();
  }, [page, onClose]));

  if (!meta) return null;

  const maxHp = stats.hp;

  // ── Página 1 — INFO ────────────────────────────────────────────────────────
  if (page === 0) {
    return (
      <Overlay>
        <InfoPage>
          <TopRow>
            <SpriteBox>
              <Sprite src={meta.images.front} alt={meta.name} />
            </SpriteBox>

            <InfoRight>
              <Label $size="6px">Nº{String(meta.id).padStart(3, "0")}</Label>
              <Label $size="9px">{meta.name.toUpperCase()}</Label>
              <Label $size="6px">
                {meta.types.map((t) => (
                  <TypeBadge key={t}>{TYPE_ES[t] ?? t.toUpperCase()}</TypeBadge>
                ))}
              </Label>
              <Divider />
              <Label $size="6px">ALTURA</Label>
              <Label $size="7px">{fmtHeight(meta.height)}</Label>
            </InfoRight>
          </TopRow>

          <Divider />

          <Label $size="7px">NV. {pokemon.level}</Label>

          <HpRow>
            <Label $size="7px">PS</Label>
            <div style={{ flex: 1 }}>
              <HealthBar currentHealth={pokemon.hp} maxHealth={maxHp} big />
            </div>
          </HpRow>
          <HpNum>
            {pokemon.hp}/{maxHp}
          </HpNum>

          <NavHint>A: STATS  B: VOLVER</NavHint>
        </InfoPage>
      </Overlay>
    );
  }

  // ── Página 2 — STATS ───────────────────────────────────────────────────────
  return (
    <Overlay>
      <StatsPage>
        <StatsTitle>{meta.name.toUpperCase()}  NV.{pokemon.level}</StatsTitle>

        <Divider />

        {(
          [
            ["PS",      `${pokemon.hp}/${maxHp}`],
            ["ATAQUE",  stats.attack],
            ["DEFENSA", stats.defense],
            ["VELOC.",  stats.speed],
            ["ESPECIAL",stats.specialAttack],
          ] as [string, string | number][]
        ).map(([name, val]) => (
          <StatRow key={name}>
            <StatName>{name}</StatName>
            <StatVal>{val}</StatVal>
          </StatRow>
        ))}

        <MovesSection>
          <MovesTitleRow>MOVIMIENTOS</MovesTitleRow>
          {pokemon.moves.map((m) => {
            const md = getMoveMetadata(m.id);
            return (
              <MoveRow key={m.id}>
                <MoveName>{(md?.name ?? m.id).toUpperCase()}</MoveName>
                <MovePP>PP {m.pp}/{md?.pp ?? "–"}</MovePP>
              </MoveRow>
            );
          })}
        </MovesSection>

        <NavHint>← INFO  B: VOLVER</NavHint>
      </StatsPage>
    </Overlay>
  );
};

export default PokemonSummary;
