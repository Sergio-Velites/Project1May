import styled from "styled-components";

import Menu, { MenuItemType } from "./Menu";
import { useDispatch, useSelector } from "react-redux";
import { selectStartMenu } from "../state/uiSlice";
import useIsMobile from "../app/use-is-mobile";
import { selectActivePokemon, swapMoves } from "../state/gameSlice";
import Frame from "./Frame";
import { useState, useEffect } from "react";
import useMoveMetadata, { getMoveMetadata } from "../app/use-move-metadata";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";

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
  const dispatch = useDispatch();
  const startMenuOpen = useSelector(selectStartMenu);
  const isMobile = useIsMobile();
  const activePokemon = useSelector(selectActivePokemon);

  const [active, setActive] = useState(0);
  const [noPpNotice, setNoPpNotice] = useState<string | null>(null);
  // Índice del movimiento "marcado" para intercambio (estilo Select de Gen I).
  // Solo en modo combate normal (no en overrideMoves del flujo learn-move).
  const [swapIndex, setSwapIndex] = useState<number | null>(null);

  // Limpiar estados cuando el menú se cierra
  useEffect(() => {
    if (!show) {
      setNoPpNotice(null);
      setSwapIndex(null);
    }
  }, [show]);

  // Botón Select: marcar movimiento o intercambiar.
  // Deshabilitado en modo learn-move (overrideMoves) y mientras hay aviso de PP.
  useEvent(Event.Select, () => {
    if (!show) return;
    if (overrideMoves) return;
    if (noPpNotice) return;
    if (startMenuOpen) return;
    if (active >= activePokemon.moves.length) return;

    if (swapIndex === null) {
      setSwapIndex(active);
      return;
    }
    if (swapIndex === active) {
      setSwapIndex(null);
      return;
    }
    dispatch(swapMoves({ fromIndex: swapIndex, toIndex: active }));
    setSwapIndex(null);
  });

  const displayMoves = overrideMoves ?? activePokemon.moves;
  const move = useMoveMetadata(displayMoves[Math.min(active, displayMoves.length - 1)]?.id ?? activePokemon.moves[0].id);

  return (
    <>
      <Menu
        tight
        noExitOption
        disabled={startMenuOpen || noPpNotice !== null}
        padd={4}
        padding={isMobile ? "100px" : "40vw"}
        show={show}
        menuItems={displayMoves.map((m, i) => {
          const ppEmpty = m.pp <= 0;
          const isMarked = swapIndex === i;
          const item: MenuItemType = {
            label: (isMarked ? "↕" : "") + getMoveMetadata(m.id).name,
            action: () => {
              if (ppEmpty) {
                // Mostrar aviso y NO seleccionar el movimiento
                setNoPpNotice("¡No quedan PP de\nese movimiento!");
                setTimeout(() => setNoPpNotice(null), 1500);
              } else {
                select(m.id);
              }
            },
          };
          return item;
        })}
        close={close}
        bottom="0"
        right="0"
        setHovered={(index) => setActive(index)}
      />
      {show && move && !noPpNotice && (
        <Stats>
          <Frame>
            <StatsRow>Tipo/</StatsRow>
            <StatsRow style={{ textAlign: "center" }}>{move?.type}</StatsRow>
            <StatsRow
              style={{ textAlign: "right" }}
            >{`${displayMoves[Math.min(active, displayMoves.length - 1)]?.pp ?? 0}/${move.pp}`}</StatsRow>
            {swapIndex !== null && (
              <StatsRow style={{ textAlign: "center", marginTop: "0.6rem" }}>
                SELECT: cambiar
              </StatsRow>
            )}
          </Frame>
        </Stats>
      )}
      {show && noPpNotice && (
        <Stats>
          <Frame>
            {noPpNotice.split("\n").map((line, i) => (
              <StatsRow key={i} style={{ textAlign: "center" }}>{line}</StatsRow>
            ))}
          </Frame>
        </Stats>
      )}
    </>
  );
};

export default MoveSelect;
