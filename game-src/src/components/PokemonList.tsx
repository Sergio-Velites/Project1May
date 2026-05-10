import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { selectPokemon, swapPokemonPositions } from "../state/gameSlice";
import PokemonRow from "./PokemonRow";
import { useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import Menu from "./Menu";
import Frame from "./Frame";
import { PokemonInstance } from "../state/state-types";
import { MoveMetadata } from "../app/move-metadata";
import PokemonSummary from "./PokemonSummary";

const StyledPokemonList = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  padding: 1px;
  z-index: 100;
`;

const ListArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`;

const InfoArea = styled.div`
  flex-shrink: 0;
`;

const EmptyRow = styled.div`
  width: 100%;
  display: flex;
  margin-bottom: 1px;
  align-items: center;
  min-height: 19px;

  @media (min-width: 1000px) {
    min-height: 8vh;
    margin-bottom: 1vh;
  }
`;

interface Props {
  close: () => void;
  /**
   * Modo del listado:
   * - "default" (sin definir): party screen — menú [Datos, Cambiar]; el
   *   "Cambiar" entra en modo intercambio interno (swap de posiciones del equipo).
   * - "battle": pantalla PKMN dentro de combate — menú [Cambiar, Datos]; el
   *   "Cambiar" delega en `switchAction(index)` (PokemonEncounter aplica la
   *   sustitución y el turno del rival). No se permite cambiar al activo
   *   (refusal lo gestiona el switchAction).
   */
  mode?: "default" | "battle";
  switchAction?: (index: number) => void;
  clickPokemon?: (index: number) => void;
  text?: string;
  customPokemon?: PokemonInstance[];
  moveData?: MoveMetadata;
}

const PokemonList = ({
  close,
  mode,
  switchAction,
  text,
  clickPokemon,
  customPokemon,
  moveData,
}: Props) => {
  const dispatch = useDispatch();
  const pokemon_ = useSelector(selectPokemon);
  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const [scroll, setScroll] = useState(0);
  const [viewingStats, setViewingStats] = useState(false);

  const pokemon = customPokemon ?? pokemon_;
  const isBattleMode = mode === "battle";

  // Índice absoluto del cursor en la lista (active + scroll).
  const cursorIndex = active + scroll;

  useEvent(Event.Up, () => {
    if (selected || viewingStats) return;

    if (active === 0) return;

    if (pokemon.length > 6 && scroll > 0) setScroll((prev) => prev - 1);
    else setActive((prev) => prev - 1);
  });

  useEvent(Event.Down, () => {
    if (selected || viewingStats) return;

    if (active === pokemon.length - 1) return;
    if (pokemon.length > 6 && scroll === pokemon.length - 5) return;

    if (pokemon.length > 6 && active === 4) setScroll((prev) => prev + 1);
    else setActive((prev) => prev + 1);
  });

  useEvent(Event.B, () => {
    if (selected || viewingStats) return;
    close();
  });

  // ── Helper: ejecutar swap de posiciones (party screen) ───────────────────
  const performSwap = (from: number, to: number) => {
    if (from === to) {
      // En Game Boy, pulsar A sobre el mismo slot cancela el modo intercambio.
      setSwitching(null);
      return;
    }
    dispatch(swapPokemonPositions([from, to]));
    setActive(0);
    setSwitching(null);
    setSelected(false);
  };

  useEvent(Event.A, () => {
    if (selected || viewingStats) return;

    if (clickPokemon) {
      clickPokemon(cursorIndex);
      return;
    }

    if (switching !== null) {
      performSwap(cursorIndex, switching);
      return;
    }

    setSelected(true);
  });

  // ── Items del menú [Datos / Cambiar] según contexto ──────────────────────
  const datosItem = {
    label: "Datos",
    action: () => {
      setSelected(false);
      setViewingStats(true);
    },
  };

  const cambiarItem = {
    label: "Cambiar",
    action: () => {
      setSelected(false);
      if (isBattleMode) {
        // En combate: PokemonEncounter decide si rechaza (mismo activo, KO).
        if (switchAction) switchAction(cursorIndex);
      } else {
        // Party screen: marcar slot y pedir destino.
        setSwitching(cursorIndex);
      }
    },
  };

  const menuItems = isBattleMode
    ? [cambiarItem, datosItem]
    : [datosItem, cambiarItem];

  return (
    <>
      {viewingStats && (
        <PokemonSummary
          pokemon={pokemon[cursorIndex]}
          onClose={() => setViewingStats(false)}
        />
      )}
      <StyledPokemonList>
        <ListArea>
          {Array.from({ length: 6 }, (_, i) => {
            const p = pokemon[scroll + i];
            return p ? (
              <PokemonRow
                key={i}
                pokemon={p}
                active={active === i}
                swapMarked={
                  switching !== null && switching === scroll + i
                }
                moveData={moveData}
              />
            ) : (
              <EmptyRow key={i} />
            );
          })}
        </ListArea>
        <InfoArea>
          <Frame wide tall>
            {text
              ? text
              : switching !== null
              ? "¿Dónde mover al POKÉMON?"
              : "Elige un POKÉMON."}
          </Frame>
        </InfoArea>
      </StyledPokemonList>
      <Menu
        right="0"
        bottom="0"
        show={selected}
        menuItems={menuItems}
        close={() => setSelected(false)}
      />
    </>
  );
};

export default PokemonList;
