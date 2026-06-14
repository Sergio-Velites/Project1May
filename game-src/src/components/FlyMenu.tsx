import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import Frame from "./Frame";
import {
  hideFlyMenu,
  selectFlyMenu,
  showTextThenAction,
  startFlyAnimation,
} from "../state/uiSlice";
import { selectMapId, selectPokemon, selectVisitedMaps } from "../state/gameSlice";
import { getPokemonMetadata } from "../app/use-pokemon-metadata";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  getAllFlyDestinations,
  KANTO_MINIMAP_HEIGHT,
  KANTO_MINIMAP_WIDTH,
} from "../app/fly-helper";

import kantoMap from "../assets/map/kanto_region.png";
import birdDown from "../assets/walk-sprites/bird-down.png";

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  background: #081820;
  display: flex;
  align-items: center;
  justify-content: center;
`;

// Caja con la relación de aspecto EXACTA del PNG (237×213). Así los puntos
// posicionados por porcentaje quedan perfectamente alineados con el mapa,
// independientemente del tamaño de la pantalla.
const MapBox = styled.div`
  position: relative;
  aspect-ratio: ${KANTO_MINIMAP_WIDTH} / ${KANTO_MINIMAP_HEIGHT};
  width: min(100%, calc(100vh * ${KANTO_MINIMAP_WIDTH} / ${KANTO_MINIMAP_HEIGHT}));
  max-height: 100%;
`;

const MapImg = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;

const Dot = styled.div<{ $x: number; $y: number; $selected: boolean }>`
  position: absolute;
  left: ${(p) => (p.$x / KANTO_MINIMAP_WIDTH) * 100}%;
  top: ${(p) => (p.$y / KANTO_MINIMAP_HEIGHT) * 100}%;
  width: ${(p) => (p.$selected ? 0 : 8)}px;
  height: ${(p) => (p.$selected ? 0 : 8)}px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #d82800;
  border: 1px solid #fff;
  box-shadow: 0 0 0 1px #000;
`;

const bob = keyframes`
  0%, 100% { transform: translate(-50%, -90%); }
  50%      { transform: translate(-50%, -110%); }
`;

const BirdCursor = styled.img<{ $x: number; $y: number }>`
  position: absolute;
  left: ${(p) => (p.$x / KANTO_MINIMAP_WIDTH) * 100}%;
  top: ${(p) => (p.$y / KANTO_MINIMAP_HEIGHT) * 100}%;
  width: 22px;
  height: 22px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  transform: translate(-50%, -100%);
  animation: ${bob} 0.6s steps(2, end) infinite;
  filter: drop-shadow(0 1px 0 #000);
`;

const NameBar = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 110;
`;

const Hint = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 110;
`;

/**
 * Mapa de Kanto para la MO Vuelo (estilo Gen I). El jugador mueve el cursor
 * (pájaro) entre las ciudades disponibles con las flechas (salta a la ciudad
 * más cercana en esa dirección), A para volar y B para salir.
 *
 * Las ciudades disponibles = mapas con `flyable` + `minimapPos` + `flySpot`
 * (configurado desde el Map Editor) Y que el jugador haya visitado
 * (`visitedMaps`). El punto en el mapa lo da `minimapPos`; el aterrizaje,
 * `flySpot`.
 */
const FlyMenu = () => {
  const dispatch = useDispatch();
  const show = useSelector(selectFlyMenu);
  const visited = useSelector(selectVisitedMaps);
  const currentMap = useSelector(selectMapId);
  const pokemon = useSelector(selectPokemon);

  // Destinos disponibles: flyable + minimapPos + flySpot + visitado, y que no
  // sea el mapa en el que ya estás (no tiene sentido volar a tu propia casilla).
  const destinations = useMemo(
    () =>
      getAllFlyDestinations().filter(
        (d) => visited.includes(d.map) && d.map !== currentMap
      ),
    [visited, currentMap]
  );

  const [index, setIndex] = useState(0);
  // Clamp por si el conjunto cambió entre aperturas.
  const safeIndex = destinations.length ? index % destinations.length : 0;
  const selected = destinations[safeIndex];

  // Salta al destino más cercano en la dirección pulsada (proyección sobre el
  // eje + penalización del desvío perpendicular para preferir los alineados).
  const move = (dirX: number, dirY: number) => {
    if (!show || !selected || destinations.length < 2) return;
    let best = -1;
    let bestScore = Infinity;
    destinations.forEach((d, i) => {
      if (i === safeIndex) return;
      const dx = d.minimapPos.x - selected.minimapPos.x;
      const dy = d.minimapPos.y - selected.minimapPos.y;
      const proj = dx * dirX + dy * dirY;
      if (proj <= 0) return; // no está en esa dirección
      const perp = Math.abs(dx * dirY - dy * dirX);
      const score = proj + perp * 2;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best >= 0) setIndex(best);
  };

  useEvent(Event.Up, () => move(0, -1));
  useEvent(Event.Down, () => move(0, 1));
  useEvent(Event.Left, () => move(-1, 0));
  useEvent(Event.Right, () => move(1, 0));

  useEvent(Event.B, () => {
    if (show) dispatch(hideFlyMenu());
  });

  useEvent(Event.A, () => {
    if (!show || !selected) return;
    dispatch(hideFlyMenu());
    const flyer = pokemon.find((p) => p.moves.some((m) => m.id === "fly"));
    const name = flyer
      ? getPokemonMetadata(flyer.id).name.toUpperCase()
      : "POKÉMON";
    const dest = selected;
    dispatch(
      showTextThenAction({
        text: [`¡${name} usó VUELO!`],
        action: () =>
          dispatch(startFlyAnimation({ map: dest.map, pos: dest.flySpot })),
      })
    );
  });

  if (!show) return null;

  // Salvaguarda: si no hay destinos (no debería ocurrir, la opción "Volar"
  // solo aparece si hay alguno), cerramos.
  if (destinations.length === 0) {
    dispatch(hideFlyMenu());
    return null;
  }

  return (
    <Container>
      <MapBox>
        <MapImg src={kantoMap} alt="Mapa de Kanto" />
        {destinations.map((d, i) => (
          <Dot
            key={d.map}
            $x={d.minimapPos.x}
            $y={d.minimapPos.y}
            $selected={i === safeIndex}
          />
        ))}
        {selected && (
          <BirdCursor
            src={birdDown}
            alt="cursor"
            $x={selected.minimapPos.x}
            $y={selected.minimapPos.y}
          />
        )}
      </MapBox>
      <NameBar>
        <Frame wide>{selected ? selected.name : ""}</Frame>
      </NameBar>
      <Hint>
        <Frame wide>A: VOLAR &nbsp; B: SALIR</Frame>
      </Hint>
    </Container>
  );
};

export default FlyMenu;
