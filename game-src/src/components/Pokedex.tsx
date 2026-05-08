/**
 * Pokédex — estilo Gen I (Rojo/Azul)
 *
 * Pantalla 1: lista de los 151 (vistos / capturados / desconocido)
 * Pantalla 2: ficha detallada — sprite, tipo, altura, descripción basada en tipo
 *
 * Navegación:
 *   ↑↓ → moverse por la lista
 *   A  → ver ficha del pokémon seleccionado (si visto)
 *   B  → cerrar lista / volver desde ficha
 */

import { useCallback, useState } from "react";
import styled, { css } from "styled-components";
import { useSelector } from "react-redux";
import { selectSeenPokemon, selectCaughtPokemon } from "../state/gameSlice";
import usePokemonMetadata, { getPokemonMetadata } from "../app/use-pokemon-metadata";
import usePokemonStats from "../app/use-pokemon-stats";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import PixelImage from "../styles/PixelImage";

// ── Descriptions by type (Gen I flavour) ───────────────────────────────────

const TYPE_DESC: Record<string, string> = {
  normal:   "Pokémon de tipo NORMAL. Sus características son equilibradas.",
  fire:     "Pokémon de tipo FUEGO. Emite un calor abrasador.",
  water:    "Pokémon de tipo AGUA. Se mueve a gran velocidad en el agua.",
  electric: "Pokémon de tipo ELÉCTRICO. Descarga potentes rayos.",
  grass:    "Pokémon de tipo PLANTA. Absorbe energía solar para vivir.",
  ice:      "Pokémon de tipo HIELO. Su temperatura corporal es muy baja.",
  fighting: "Pokémon de tipo LUCHA. Posee una fuerza y resistencia enormes.",
  poison:   "Pokémon de tipo VENENO. Segrega toxinas para defenderse.",
  ground:   "Pokémon de tipo TIERRA. Vive bajo la tierra y la excava.",
  flying:   "Pokémon de tipo VOLADOR. Surca los cielos con gran agilidad.",
  psychic:  "Pokémon de tipo PSÍQUICO. Utiliza poderes paranormales.",
  bug:      "Pokémon de tipo BICHO. Abunda en bosques y praderas.",
  rock:     "Pokémon de tipo ROCA. Su cuerpo es duro como la piedra.",
  ghost:    "Pokémon de tipo FANTASMA. Aterroriza a sus enemigos.",
  dragon:   "Pokémon de tipo DRAGÓN. Pokémon de élite difícil de capturar.",
};

const getDesc = (types: string[]): string =>
  TYPE_DESC[types[0]] ?? "Pokémon poco conocido. Los datos son insuficientes.";

const fmtHeight = (dm: number): string => {
  const inches = Math.round((dm * 10) / 2.54);
  const ft = Math.floor(inches / 12);
  const inch = inches % 12;
  return `${ft}'${String(inch).padStart(2, "0")}"`;
};

const TYPE_ES: Record<string, string> = {
  normal: "NORMAL",   fire: "FUEGO",   water: "AGUA",    electric: "ELÉCT.",
  grass: "PLANTA",    ice: "HIELO",    fighting: "LUCHA", poison: "VENENO",
  ground: "TIERRA",   flying: "VOLAD.", psychic: "PSÍQUI.", bug: "BICHO",
  rock: "ROCA",       ghost: "FANTAS.", dragon: "DRAGÓN",  dark: "SINIS.",
  steel: "ACERO",     fairy: "HADA",
};

const TOTAL = 151;
const PAGE_SIZE = 7; // visible rows

// ── Styled components ────────────────────────────────────────────────────────

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
  font-size: 2.4cqw;
`;

const HeaderBar = styled.div`
  background: #181010;
  color: var(--bg);
  padding: 1px 4px;
  display: flex;
  justify-content: space-between;
  flex-shrink: 0;
`;

const HRule = styled.div`
  height: 2px;
  background: #181010;
  flex-shrink: 0;
`;

const Txt = styled.span<{ $size?: number; $bold?: boolean }>`
  font-size: ${(p) => (p.$size ? `${p.$size}em` : "1em")};
  font-weight: ${(p) => (p.$bold ? "bold" : "normal")};
  line-height: 1.6;
  color: inherit;
`;

const ListArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

interface RowProps { $active: boolean; }
const ListRow = styled.div<RowProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 4px;
  border-bottom: 1px solid #c8c0b0;
  background: ${(p) => (p.$active ? "#181010" : "var(--bg)")};
  color: ${(p) => (p.$active ? "#f9f2fa" : "#181010")};
  flex-shrink: 0;
  & * { color: inherit; }
`;

const NavHint = styled.div`
  font-size: 0.75em;
  text-align: right;
  padding: 1px 4px;
  border-top: 1px solid #aaa;
  color: #555;
  flex-shrink: 0;
`;

// Detail screen
const DetailArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const SpriteBox = styled.div`
  border-right: 2px solid #181010;
  width: 42%;
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

const InfoCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2px 4px;
  gap: 2px;
  overflow: hidden;
`;

const DescBox = styled.div`
  padding: 3px 4px;
  font-size: 0.8em;
  line-height: 1.5;
  border-top: 2px solid #181010;
  flex-shrink: 0;
`;

// ── Sub-components ───────────────────────────────────────────────────────────

interface DetailProps { id: number; onBack: () => void; }
const Detail = ({ id, onBack }: DetailProps) => {
  const meta  = usePokemonMetadata(id);
  const stats = usePokemonStats(id, 50); // show base stats at lv50 for reference

  useEvent(Event.B, onBack);
  useEvent(Event.A, onBack);

  if (!meta) return null;

  const desc = getDesc(meta.types);

  return (
    <Screen>
      <HeaderBar>
        <Txt $size={0.9}>Nº{String(id).padStart(3, "0")}</Txt>
        <Txt $size={1.0} $bold>{meta.name.toUpperCase()}</Txt>
      </HeaderBar>

      <DetailArea>
        {/* Sprite + Info row, fixed height */}
        <div style={{ display: "flex", flexShrink: 0, height: "48%" }}>
          <SpriteBox>
            <SpriteImg src={meta.images.front} alt={meta.name} />
          </SpriteBox>
          <InfoCol>
            {meta.types.map((t) => (
              <Txt key={t} $size={0.85}>TIPO:{TYPE_ES[t] ?? t.toUpperCase()}</Txt>
            ))}
            <HRule />
            <Txt $size={0.8}>Alt.{fmtHeight(meta.height)}</Txt>
            <HRule />
            <Txt $size={0.75}>Nv.50 ref.:</Txt>
            <Txt $size={0.75}>ATQ {stats.attack}</Txt>
            <Txt $size={0.75}>DEF {stats.defense}</Txt>
            <Txt $size={0.75}>VEL {stats.speed}</Txt>
            <Txt $size={0.75}>ESP {stats.specialAttack}</Txt>
          </InfoCol>
        </div>

        <DescBox>
          {desc}
        </DescBox>
      </DetailArea>

      <NavHint>B: VOLVER</NavHint>
    </Screen>
  );
};

// ── Main list component ───────────────────────────────────────────────────────

interface Props { onClose: () => void; }

const Pokedex = ({ onClose }: Props) => {
  const seen   = useSelector(selectSeenPokemon);
  const caught = useSelector(selectCaughtPokemon);

  const [cursor, setCursor] = useState(0); // 0-based index into 1..151
  const [scroll, setScroll]  = useState(0);
  const [detail, setDetail]  = useState<number | null>(null);

  // If viewing detail, delegate events to Detail
  useEvent(Event.Up, useCallback(() => {
    if (detail !== null) return;
    if (cursor === 0) return;
    if (cursor - scroll === 0 && scroll > 0) {
      setScroll((p) => p - 1);
    }
    setCursor((p) => Math.max(0, p - 1));
  }, [detail, cursor, scroll]));

  useEvent(Event.Down, useCallback(() => {
    if (detail !== null) return;
    if (cursor === TOTAL - 1) return;
    if (cursor - scroll === PAGE_SIZE - 1) {
      setScroll((p) => Math.min(TOTAL - PAGE_SIZE, p + 1));
    }
    setCursor((p) => Math.min(TOTAL - 1, p + 1));
  }, [detail, cursor, scroll]));

  useEvent(Event.A, useCallback(() => {
    if (detail !== null) return;
    const id = cursor + 1;
    if (seen.includes(id)) setDetail(id);
  }, [detail, cursor, seen]));

  useEvent(Event.B, useCallback(() => {
    if (detail !== null) return;
    onClose();
  }, [detail, onClose]));

  if (detail !== null) {
    return <Detail id={detail} onBack={() => setDetail(null)} />;
  }

  const seenCount   = seen.length;
  const caughtCount = caught.length;
  const rows = Array.from({ length: PAGE_SIZE }, (_, i) => i + scroll);

  return (
    <Screen>
      <HeaderBar>
        <Txt $size={0.85}>POKéDEX</Txt>
        <Txt $size={0.85}>V.{seenCount}  C.{caughtCount}</Txt>
      </HeaderBar>

      <ListArea>
        {rows.map((idx) => {
          const id = idx + 1;
          if (id > TOTAL) return null;
          const isSeen   = seen.includes(id);
          const isCaught = caught.includes(id);
          const isActive = idx === cursor;
          const name = isSeen
            ? getPokemonMetadata(id).name.toUpperCase()
            : "----------";
          const marker = isCaught ? "◆" : isSeen ? "○" : "·";

          return (
            <ListRow key={id} $active={isActive}>
              <Txt $size={0.7}>{marker}</Txt>
              <Txt $size={0.75}>
                {String(id).padStart(3, "0")} {name}
              </Txt>
            </ListRow>
          );
        })}
      </ListArea>

      <HRule />
      <NavHint>↑↓ navegar  A: ver  B: salir</NavHint>
    </Screen>
  );
};

export default Pokedex;
