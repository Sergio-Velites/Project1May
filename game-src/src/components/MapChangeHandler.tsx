import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  exitMap,
  selectPos,
  selectMap,
  selectMapId,
  setMap,
  setMapWithPos,
} from "../state/gameSlice";
import { useEffect, useRef } from "react";
import emitter, { Event } from "../app/emitter";
import { isExit } from "../app/map-helper";
import mapData from "../maps/map-data";
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
  const mapId = useSelector(selectMapId);
  const darkScreen = useSelector(selectBlackScreen);
  // Casilla en la que ACABAMOS de aterrizar tras una transición. Mientras el
  // jugador siga en ella no se vuelve a transportar (evita el bucle infinito
  // cuando el destino de un portal es, a su vez, otro portal). Se limpia en
  // cuanto el jugador se mueve a otra casilla; así, si vuelve a pisar el portal,
  // sí transporta.
  const arrivedAt = useRef<{ map: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const nextMap = map.maps[pos.y] ? map.maps[pos.y][pos.x] : null;
    const exit = isExit(map.exits, pos.x, pos.y);
    const teleport =
      map.teleports && map.teleports[pos.y]
        ? map.teleports[pos.y][pos.x]
        : null;

    // Anti-bucle: si estamos justo en la casilla de llegada de la última
    // transición, no transportar. Si el jugador ya se ha movido a otra casilla,
    // limpiar el guardado (una nueva pisada del portal sí transportará).
    const landed = arrivedAt.current;
    const stillOnLanding =
      !!landed && landed.map === mapId && landed.x === pos.x && landed.y === pos.y;
    if (!stillOnLanding) arrivedAt.current = null;

    if (!nextMap && !exit && !teleport) return;
    if (darkScreen) return;
    if (stillOnLanding) return;

    // Destino de la transición (para marcar la llegada y no rebotar).
    let dest: { map: string; x: number; y: number } | null = null;
    if (nextMap) {
      const s = mapData[nextMap]?.start;
      dest = { map: nextMap, x: s?.x ?? 0, y: s?.y ?? 0 };
    } else if (exit) {
      const rm = map.exitReturnMap;
      const rp = map.exitReturnPos;
      if (rm && rp) dest = { map: rm, x: rp.x, y: rp.y };
    } else if (teleport) {
      dest = { map: teleport.map, x: teleport.pos.x, y: teleport.pos.y };
    }

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
      transition(() => { arrivedAt.current = dest; dispatch(setMap(nextMap)); });
    } else if (exit) {
      transition(() => { arrivedAt.current = dest; dispatch(exitMap()); });
    } else if (teleport) {
      transition(() => { arrivedAt.current = dest; dispatch(setMapWithPos(teleport)); });
    }
  }, [pos, mapId, map, dispatch, darkScreen]);

  return <Overlay $show={darkScreen} />;
};

export default MapChangeHandler;
