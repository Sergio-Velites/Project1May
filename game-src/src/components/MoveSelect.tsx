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
  bottom: 16cqw;
  left: 0;
  right: auto;
  display: flex;
  flex-direction: column;
  width: 50%;
  z-index: 100;
`;

const StatsRow = styled.div`
  font-family: "PokemonGB";
  font-size: 2.67cqw;
  text-transform: uppercase;
  text-align: left;
  color: black;
  width: 100%;
  margin-top: 2px;
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

  const displayMoves = overrideMoves ?? (activePokemon?.moves ?? []);
  const currentIndex = displayMoves.length > 0 ? Math.min(active, displayMoves.length - 1) : 0;
  const move = useMoveMetadata(displayMoves[currentIndex]?.id ?? null);

  return (
    <>
      <Menu
        tight
        noExitOption
        disabled={startMenuOpen}
        padd={4}
        padding="7cqw"
        show={show}
        menuItems={displayMoves.map((m) => {
          const item: MenuItemType = {
            label: getMoveMetadata(m.id)?.name ?? m.id,
            action: () => select(m.id),
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
            >{`${displayMoves[currentIndex]?.pp ?? 0}/${move.pp ?? 0}`}</StatsRow>
          </Frame>
        </Stats>
      )}
    </>
  );
};

export default MoveSelect;
