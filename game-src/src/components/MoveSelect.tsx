import styled from "styled-components";

import Menu, { MenuItemType } from "./Menu";
import { useSelector } from "react-redux";
import { selectStartMenu } from "../state/uiSlice";
import useIsMobile from "../app/use-is-mobile";
import { selectActivePokemon } from "../state/gameSlice";
import Frame from "./Frame";
import { useState } from "react";
import useMoveMetadata, { getMoveMetadata } from "../app/use-move-metadata";

const Stats = styled.div`
  position: absolute;
  bottom: 20rem;
  right: 45vw;
  display: flex;
  flex-direction: column;
  width: 35rem;
  z-index: 100;

  @media (max-width: 1000px) {
    bottom: 6rem;
    left: 0;
    width: 50%;
  }
`;

const StatsRow = styled.div`
  font-family: "PokemonGB";
  font-size: 3rem;
  text-transform: uppercase;
  text-align: left;
  color: black;
  width: 100%;
  margin-top: 5px;

  @media (max-width: 1000px) {
    font-size: 1rem;
    margin-top: 2px;
  }
`;

interface Props {
  show: boolean;
  select: (move: string) => void;
  close: () => void;
  overrideMoves?: { id: string; pp: number }[];
}

const MoveSelect = ({ show, select, close, overrideMoves }: Props) => {
  const startMenuOpen = useSelector(selectStartMenu);
  const isMobile = useIsMobile();
  const activePokemon = useSelector(selectActivePokemon);

  const [active, setActive] = useState(0);

  const displayMoves = overrideMoves ?? activePokemon.moves;
  const move = useMoveMetadata(displayMoves[Math.min(active, displayMoves.length - 1)]?.id ?? activePokemon.moves[0].id);

  return (
    <>
      <Menu
        tight
        noExitOption
        disabled={startMenuOpen}
        padd={4}
        padding={isMobile ? "100px" : "40vw"}
        show={show}
        menuItems={displayMoves.map((m) => {
          const ppEmpty = m.pp <= 0;
          const item: MenuItemType = {
            // Marcar visualmente los movimientos sin PP
            label: ppEmpty
              ? `${getMoveMetadata(m.id).name} --`
              : getMoveMetadata(m.id).name,
            // Gen I: seleccionar un movimiento sin PP usa Forcejeo en su lugar
            action: () => select(ppEmpty ? "struggle" : m.id),
          };
          return item;
        })}
        close={close}
        bottom="0"
        right="0"
        setHovered={(index) => setActive(index)}
      />
      {show && move && (
        <Stats>
          <Frame>
            <StatsRow>Type/</StatsRow>
            <StatsRow style={{ textAlign: "center" }}>{move?.type}</StatsRow>
            <StatsRow
              style={{ textAlign: "right" }}
            >{`${displayMoves[Math.min(active, displayMoves.length - 1)]?.pp ?? 0}/${move.pp}`}</StatsRow>
          </Frame>
        </Stats>
      )}
    </>
  );
};

export default MoveSelect;
