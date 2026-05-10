/**
 * PokemonSummary — Pantalla de datos del Pokémon fiel al estilo Gen I (RBY).
 *
 * Página 1 — ESTADO:      sprite, Nº, nombre, tipos, FE/OT, IDNº, PS bar
 * Página 2 — HABILIDADES: movimientos con PS, stats (ATAQ/DEF/VEL/ESP)
 *
 * Navegación: A / → avanza página, ← retrocede, B cierra.
 */

import { useCallback, useState } from "react";
import styled, { css } from "styled-components";
import { useSelector } from "react-redux";
import { PokemonInstance } from "../state/state-types";
import usePokemonMetadata from "../app/use-pokemon-metadata";
import usePokemonStats from "../app/use-pokemon-stats";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import PixelImage from "../styles/PixelImage";
import { getMoveMetadata } from "../app/use-move-metadata";
import { selectName } from "../state/gameSlice";

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtHeight = (dm: number): string => {
  const inches = Math.round((dm * 10) / 2.54);
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${String(inch).padStart(2, "0")}"`;
};

const TYPE_ES: Record<string, string> = {
  normal: "NORMAL",   fire: "FUEGO",   water: "AGUA",    electric: "ELÉCTRICO",
  grass: "PLANTA",    ice: "HIELO",    fighting: "LUCHA", poison: "VENENO",
  ground: "TIERRA",   flying: "VOLADOR", psychic: "PSÍQUICO", bug: "BICHO",
  rock: "ROCA",       ghost: "FANTASMA", dragon: "DRAGÓN",  dark: "SINIESTRO",
  steel: "ACERO",     fairy: "HADA",
};

const hpColor = (cur: number, max: number) => {
  const pct = cur / max;
  if (pct > 0.5) return "#58b858";
  if (pct > 0.25) return "#f8b800";
  return "#f83800";
};

// ── Base layout ───────────────────────────────────────────────────────────────

const Screen = styled.div`
  position: absolute;
  inset: 0;
  z-index: 200;
  background: var(--bg);
  font-family: "PokemonGB", monospace;
  color: #181010;
  display: flex;
  flex-direction: column;
  border: 3px solid #181010;
  box-sizing: border-box;
  overflow: hidden;

  /* all font-sizes scale with container */
  font-size: 9px;
  @media (min-width: 1000px) { font-size: 1.8vh; }
`;

const HRule = styled.div`
  height: 2px;
  background: #181010;
  flex-shrink: 0;
`;

const Row = styled.div<{ $gap?: string; $align?: string; $justify?: string }>`
  display: flex;
  flex-direction: row;
  align-items: ${(p) => p.$align ?? "stretch"};
  justify-content: ${(p) => p.$justify ?? "flex-start"};
  gap: ${(p) => p.$gap ?? "0"};
`;

const Col = styled.div<{ $flex?: string; $gap?: string; $pad?: string }>`
  display: flex;
  flex-direction: column;
  flex: ${(p) => p.$flex ?? "unset"};
  gap: ${(p) => p.$gap ?? "0"};
  padding: ${(p) => p.$pad ?? "0"};
`;

const Txt = styled.span<{ $size?: number; $bold?: boolean }>`
  font-size: ${(p) => (p.$size ? `${p.$size}em` : "1em")};
  font-weight: ${(p) => (p.$bold ? "bold" : "normal")};
  line-height: 1.6;
`;

// ── Page 1 — ESTADO ───────────────────────────────────────────────────────────

const HeaderBar = styled(Row)`
  background: #181010;
  color: var(--bg);
  padding: 1px 4px;
  flex-shrink: 0;
`;

const TypeTag = styled.span`
  display: inline-block;
  border: 1px solid #181010;
  padding: 0 3px;
  font-size: 0.85em;
  line-height: 1.5;
  margin-right: 2px;
`;

const SpriteBox = styled.div`
  border-right: 2px solid #181010;
  width: 44%;
  flex-shrink: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 4px;
  overflow: hidden;
`;

const SpriteImg = styled(PixelImage)`
  width: 100%;
  height: 100%;
  object-fit: contain;
`;

const InfoBlock = styled(Col)`
  flex: 1;
  padding: 3px 4px;
  gap: 2px;
  justify-content: space-between;
  overflow: hidden;
  min-height: 0;
`;

interface BarProps { $pct: number; $color: string; }
const BarTrack = styled.div`
  height: 4px;
  border: 1px solid #181010;
  background: var(--bg);
  flex: 1;
`;
const BarFill = styled.div<BarProps>`
  height: 100%;
  width: ${(p) => Math.min(100, p.$pct)}%;
  background: ${(p) => p.$color};
  transition: width 0.8s ease-out;
`;

const HpSection = styled(Col)`
  padding: 3px 4px 2px;
  gap: 1px;
`;

const NavHint = styled.div`
  font-size: 0.75em;
  text-align: right;
  padding: 1px 4px;
  border-top: 1px solid #aaa;
  color: #555;
  flex-shrink: 0;
`;

// ── Page 2 — HABILIDADES ─────────────────────────────────────────────────────

const MovesHeader = styled(Row)`
  padding: 1px 4px;
  border-bottom: 2px solid #181010;
  flex-shrink: 0;
`;

const MoveSlot = styled(Row)`
  padding: 1px 4px;
  border-bottom: 1px solid #c8c0b0;
  align-items: center;
`;

const MoveLabel = styled.span`
  flex: 1;
  font-size: 0.9em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MovePP = styled.span`
  font-size: 0.85em;
  white-space: nowrap;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 2px solid #181010;
  margin-top: auto;
  flex-shrink: 0;
`;

const StatCell = styled.div<{ $border?: boolean }>`
  padding: 1px 4px;
  display: flex;
  justify-content: space-between;
  ${(p) => p.$border && css`border-right: 1px solid #181010;`}
  border-bottom: 1px solid #c8c0b0;
`;

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  pokemon: PokemonInstance;
  onClose: () => void;
}

const PokemonSummary = ({ pokemon, onClose }: Props) => {
  const [page, setPage] = useState<0 | 1>(0);
  const meta   = usePokemonMetadata(pokemon.id);
  const stats  = usePokemonStats(pokemon.id, pokemon.level);
  const otName = useSelector(selectName) as string;

  useEvent(Event.Left,  useCallback(() => setPage(0), []));
  useEvent(Event.Right, useCallback(() => setPage(1), []));
  useEvent(Event.B,     onClose);
  useEvent(Event.A,     useCallback(() => {
    if (page === 0) setPage(1); else onClose();
  }, [page, onClose]));

  if (!meta) return null;

  const maxHp  = stats.hp;
  const hpPct  = (pokemon.hp / maxHp) * 100;
  const hpCol  = hpColor(pokemon.hp, maxHp);
  const idStr  = String(meta.id).padStart(5, "0");
  const noStr  = `Nº${String(meta.id).padStart(3, "0")}`;

  // XP to next level — Gen I Medium Fast: nextLevel³
  const nextLvl = pokemon.level + 1;
  const xpForNext = Math.pow(nextLvl, 3) - Math.pow(pokemon.level, 3);
  const xpPct = Math.min(100, (pokemon.xp / xpForNext) * 100);

  // ── Página 1 — ESTADO ──────────────────────────────────────────────────────
  if (page === 0) {
    return (
      <Screen>
        {/* Header */}
        <HeaderBar $align="center" $justify="space-between">
          <Txt $size={0.9}>{noStr}</Txt>
          <Txt $size={1.05} $bold>{meta.name.toUpperCase()}</Txt>
        </HeaderBar>

        {/* Types */}
        <Row $align="center" $gap="4px" style={{ padding: "2px 4px", flexShrink: 0 }}>
          {meta.types.map((t) => (
            <Txt key={t} $size={0.85}>
              TIPO{meta.types.indexOf(t) + 1}
              <TypeTag>{TYPE_ES[t] ?? t.toUpperCase()}</TypeTag>
            </Txt>
          ))}
        </Row>

        <HRule />

        {/* Middle: sprite + info — fixed height, no overlap */}
        <Row style={{ flex: 1, minHeight: 0 }}>
          <SpriteBox>
            <SpriteImg src={meta.images.front} alt={meta.name} />
          </SpriteBox>
          <InfoBlock>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <Txt $size={0.8}>FE/{otName.toUpperCase()}</Txt>
              <Txt $size={0.8}>IDNº{idStr}</Txt>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
              <Txt $size={0.8}>Nv.{pokemon.level}</Txt>
              <Txt $size={0.75}>Alt.{fmtHeight(meta.height)}</Txt>
            </div>
          </InfoBlock>
        </Row>

        <HRule />

        {/* HP section */}
        <HpSection>
          <Row $align="center" $gap="4px">
            <Txt $size={0.9} $bold>PS</Txt>
            <BarTrack>
              <BarFill $pct={hpPct} $color={hpCol} />
            </BarTrack>
            <Txt $size={0.9}>{pokemon.hp}/{maxHp}</Txt>
            {pokemon.status && (
              <Txt $size={0.9} $bold>
                {" "}{({
                  poison: "PSN",
                  "badly-poisoned": "PSN",
                  burn: "QMD",
                  paralysis: "PAR",
                  sleep: "DRM",
                  freeze: "CNG",
                } as Record<string, string>)[pokemon.status.type]}
              </Txt>
            )}
          </Row>
        </HpSection>

        <NavHint>A: HABILIDADES   B: VOLVER</NavHint>
      </Screen>
    );
  }

  // ── Página 2 — HABILIDADES ─────────────────────────────────────────────────
  // 4 empty move slots
  const moves = [...pokemon.moves];
  while (moves.length < 4) moves.push({ id: "", pp: 0 });

  return (
    <Screen>
      {/* Header */}
      <MovesHeader $align="center" $justify="space-between">
        <Txt $size={1.0} $bold>{meta.name.toUpperCase()}</Txt>
        <Txt $size={0.85}>Nv.{pokemon.level}</Txt>
      </MovesHeader>

      {/* Move slots */}
      <Col style={{ flex: 1 }}>
        {moves.map((m, i) => {
          const md = m.id ? getMoveMetadata(m.id) : null;
          const maxPp = md?.pp ?? 0;
          return (
            <MoveSlot key={i}>
              <MoveLabel>
                {md ? md.name.toUpperCase() : "-----"}
              </MoveLabel>
              <MovePP>
                PS{String(m.id ? m.pp : 0).padStart(3, " ")}/
                {String(maxPp).padStart(2, " ")}
              </MovePP>
            </MoveSlot>
          );
        })}
      </Col>

      {/* Stats grid */}
      <StatsGrid>
        <StatCell $border>
          <Txt $size={0.85}>ATAQ</Txt>
          <Txt $size={0.85}>{stats.attack}</Txt>
        </StatCell>
        <StatCell>
          <Txt $size={0.85}>DEF</Txt>
          <Txt $size={0.85}>{stats.defense}</Txt>
        </StatCell>
        <StatCell $border>
          <Txt $size={0.85}>VEL</Txt>
          <Txt $size={0.85}>{stats.speed}</Txt>
        </StatCell>
        <StatCell>
          <Txt $size={0.85}>ESP</Txt>
          <Txt $size={0.85}>{stats.specialAttack}</Txt>
        </StatCell>
      </StatsGrid>

      {/* XP bar */}
      <HpSection style={{ borderTop: "2px solid #181010" }}>
        <Row $align="center" $gap="4px">
          <Txt $size={0.8}>EXP</Txt>
          <BarTrack style={{ flex: 1 }}>
            <BarFill $pct={xpPct} $color="#4880f8" />
          </BarTrack>
        </Row>
        <Row $justify="space-between">
          <Txt $size={0.75}>actual {pokemon.xp}</Txt>
          <Txt $size={0.75}>siguiente {xpForNext}</Txt>
        </Row>
      </HpSection>

      <NavHint>← ESTADO   B: VOLVER</NavHint>
    </Screen>
  );
};

export default PokemonSummary;
