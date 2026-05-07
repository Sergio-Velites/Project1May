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
  /* Reserva espacio para la InfoArea superpuesta al fondo */
  padding-bottom: 32px;

  @media (min-width: 1000px) {
    padding-bottom: 11vh;
  }
`;

/* InfoArea flota sobre el fondo de la lista (como en Gen I) */
const InfoArea = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
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
  switchAction?: (index: number) => void;
  clickPokemon?: (index: number) => void;
  text?: string;
  customPokemon?: PokemonInstance[];
  moveData?: MoveMetadata;
}

const PokemonList = ({
  close,
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

  useEvent(Event.Up, () => {
    if (selected || viewingStats) return;

    if (active === 0) return;

    if (pokemon.length > 6 && scroll > 0) setScroll((prev) => prev - 1);
    else setActive((prev) => prev - 1);
  });

  useEvent(Event.Down, () => {
    if (selected || viewingStats) return;

    if (active === pokemon.length - 1) return;
    if (pokemon.length > 6 && scroll === pokemon.length - 6) return;

    if (pokemon.length > 6 && active === 5) setScroll((prev) => prev + 1);
    else setActive((prev) => prev + 1);
  });

  useEvent(Event.B, () => {
    if (selected || viewingStats) return;
    close();
  });

  useEvent(Event.A, () => {
    if (selected || viewingStats) return;

    if (clickPokemon) {
      clickPokemon(active + scroll);
      return;
    }

    if (switching !== null) {
      dispatch(swapPokemonPositions([active, switching]));
      setActive(0);
      setSwitching(null);
      setSelected(false);
      return;
    }

    setSelected(true);
  });

  return (
    <>
      {viewingStats && (
        <PokemonSummary
          pokemon={pokemon[active + scroll]}
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
                switching={switching !== null && switching === scroll + i && active !== i}
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
              : switching
              ? "¿Dónde mover al POKÉMON?"
              : "Elige un POKÉMON."}
          </Frame>
        </InfoArea>
      </StyledPokemonList>
      <Menu
        right="0"
        bottom="0"
        show={selected}
        menuItems={[
          {
            label: "Datos",
            action: () => {
              setSelected(false);
              setViewingStats(true);
            },
          },
          {
            label: "Cambiar",
            action: () => {
              setSelected(false);
              if (switchAction) switchAction(active);
              else setSwitching(active);
            },
          },
        ]}
        close={() => setSelected(false)}
      />
    </>
  );
};

export default PokemonList;
