import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  exitMap,
  selectPos,
  selectMap,
  setMap,
  setMapWithPos,
} from "../state/gameSlice";
import { useEffect } from "react";
import emitter, { Event } from "../app/emitter";
import { isExit } from "../app/map-helper";
import { selectBlackScreen, setBlackScreen } from "../state/uiSlice";

interface OverlayProps {
  $show: boolean;
}

const Overlay = styled.div<OverlayProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  opacity: ${(props) => (props.$show ? 1 : 0)};

  transition: opacity 0.3s steps(3, end);
`;

const MapChangeHandler = () => {
  const dispatch = useDispatch();
  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);
  const darkScreen = useSelector(selectBlackScreen);

  useEffect(() => {
    const nextMap = map.maps[pos.y] ? map.maps[pos.y][pos.x] : null;
    const exit = isExit(map.exits, pos.x, pos.y);
    const teleport =
      map.teleports && map.teleports[pos.y]
        ? map.teleports[pos.y][pos.x]
        : null;

    if (!nextMap && !exit && !teleport) return;
    if (darkScreen) return;

    const transition = (action: () => void) => {
      dispatch(setBlackScreen(true));
      // Primero fundir a negro (la transición del overlay dura 0.3s).
      setTimeout(() => {
        emitter.emit(Event.EnterDoor);

        // Levantar el telón SOLO cuando la imagen del nuevo mapa haya cargado
        // y se haya pintado a la escala correcta (MapBackground emite
        // Event.MapReady tras un doble rAF). Antes se usaba un temporizador
        // ciego que descubría el mapa antes de que los tiles estuvieran
        // maquetados, mostrando un fotograma a escala equivocada.
        let done = false;
        let fallback: ReturnType<typeof setTimeout>;
        const reveal = () => {
          if (done) return;
          done = true;
          emitter.off(Event.MapReady, reveal);
          clearTimeout(fallback);
          dispatch(setBlackScreen(false));
        };
        emitter.on(Event.MapReady, reveal);
        // Red de seguridad: nunca quedarse en negro indefinidamente.
        fallback = setTimeout(reveal, 1500);

        action();
      }, 300);
    };

    if (nextMap) {
      transition(() => dispatch(setMap(nextMap)));
    } else if (exit) {
      transition(() => dispatch(exitMap()));
    } else if (teleport) {
      transition(() => dispatch(setMapWithPos(teleport)));
    }
  }, [pos, map.maps, dispatch, map.exits, darkScreen, map.teleports]);

  return <Overlay $show={darkScreen} />;
};

export default MapChangeHandler;
