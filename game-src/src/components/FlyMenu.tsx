import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled, { keyframes, css } from "styled-components";
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

// Layout en COLUMNA: mapa entero (lo más grande posible) · un ÚNICO pie con el
// nombre de la ciudad + controles. El mapa nunca queda tapado por la UI — la UI
// vive fuera de él, en una sola fila inferior.
const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 100;
  background: #181010;
  display: flex;
  flex-direction: column;
`;

// Fila central: ocupa todo el espacio restante y centra el mapa al 100%. Sin
// cabecera arriba y con padding mínimo, el mapa gana el máximo de superficie.
// min-height: 0 es imprescindible en flex-column para que la imagen respete
// max-height y el mapa SIEMPRE se vea entero.
const MapRow = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8cqw;
`;

// Caja con la relación de aspecto EXACTA del mapa (237×213). En la pantalla GB
// (apaisada) la fila queda limitada por el ALTO, así que `height: 100%` +
// `aspect-ratio` escala el mapa para llenar sin distorsión; `max-width: 100%`
// lo protege si la fila fuese más estrecha que el mapa. El cursor, posicionado
// por % sobre esta caja, queda siempre perfectamente alineado.
const MapBox = styled.div`
  position: relative;
  height: 100%;
  aspect-ratio: ${KANTO_MINIMAP_WIDTH} / ${KANTO_MINIMAP_HEIGHT};
  max-width: 100%;
`;

const MapImg = styled.img`
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;

// Pie ÚNICO: nombre de la ciudad (izquierda) + controles (derecha) en una sola
// caja. Texto en cuerpo pequeño (más pequeño que el h1 del Frame), priorizando
// que el mapa respire.
const BottomBar = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1cqw;
  font-family: "PokemonGB";
  color: black;
`;

// Marquee retro: el nombre de la ciudad SIEMPRE se ve entero. Si no cabe en el
// ancho disponible, se desliza en bucle (como los letreros de los centros
// comerciales de Gen II); si cabe, se queda quieto. La "ventana" recorta y la
// "pista" se anima.
const NameViewport = styled.div`
  flex: 1;
  min-width: 0;
  overflow: hidden;
`;

const marquee = keyframes`
  from { transform: translateX(0); }
  to   { transform: translateX(calc(-1 * var(--shift, 0px))); }
`;

const NameTrack = styled.div<{ $animate: boolean }>`
  display: inline-flex;
  flex-wrap: nowrap;
  white-space: nowrap;
  will-change: transform;
  ${(p) =>
    p.$animate
      ? css`
          animation: ${marquee} linear infinite;
        `
      : ""}
`;

const NameText = styled.span`
  font-size: 1.7cqw;
  letter-spacing: 0.1cqw;
  white-space: nowrap;
`;

const Controls = styled.span`
  font-size: 1.5cqw;
  white-space: nowrap;
  flex-shrink: 0;
`;

/**
 * Nombre de la ciudad con desplazamiento en bucle SOLO cuando no cabe. Mide el
 * ancho real del texto vs. el de la ventana (re-mide al cambiar de nombre, al
 * redimensionar y cuando la fuente pixel-art termina de cargar, ya que el ancho
 * depende de ella). Cuando se desplaza, deja un hueco del ancho de la ventana
 * para que el texto salga del todo y vuelva a entrar limpio (bucle sin saltos).
 */
const ScrollingName = ({ text }: { text: string }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [anim, setAnim] = useState<{ shift: number; gap: number; duration: number } | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const vp = viewportRef.current;
      const tx = textRef.current;
      if (!vp || !tx) return;
      const contentW = tx.offsetWidth;
      const boxW = vp.clientWidth;
      if (contentW > boxW + 1) {
        const gap = Math.max(24, boxW); // hueco = ancho de ventana → salida limpia
        const shift = contentW + gap;
        const duration = shift / 45; // px/segundo → velocidad constante y legible
        setAnim({ shift, gap, duration });
      } else {
        setAnim(null);
      }
    };
    measure();
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) fonts.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", measure);
    };
  }, [text]);

  const trackStyle: CSSProperties | undefined = anim
    ? ({
        animationDuration: `${anim.duration}s`,
        "--shift": `${anim.shift}px`,
      } as CSSProperties)
    : undefined;

  return (
    <NameViewport ref={viewportRef}>
      <NameTrack $animate={!!anim} style={trackStyle}>
        <NameText ref={textRef}>{text}</NameText>
        {anim && (
          <NameText aria-hidden style={{ marginLeft: `${anim.gap}px` }}>
            {text}
          </NameText>
        )}
      </NameTrack>
    </NameViewport>
  );
};

const blink = keyframes`
  0%, 49%   { opacity: 1; }
  50%, 100% { opacity: 0.25; }
`;

// Cursor pájaro centrado SOBRE la ciudad seleccionada (parpadea como el cursor
// del Mapa Pueblo de Pokémon Rojo). Tamaño relativo al ancho del mapa para que
// escale y nunca se salga de los bordes.
const BirdCursor = styled.img<{ $x: number; $y: number }>`
  position: absolute;
  left: ${(p) => (p.$x / KANTO_MINIMAP_WIDTH) * 100}%;
  top: ${(p) => (p.$y / KANTO_MINIMAP_HEIGHT) * 100}%;
  width: 10%;
  transform: translate(-50%, -50%);
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  animation: ${blink} 0.7s steps(1, end) infinite;
  filter: drop-shadow(0 0 1px #fff);
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
      <MapRow>
        <MapBox>
          <MapImg src={kantoMap} alt="Mapa de Kanto" />
          {selected && (
            <BirdCursor
              src={birdDown}
              alt="cursor"
              $x={selected.minimapPos.x}
              $y={selected.minimapPos.y}
            />
          )}
        </MapBox>
      </MapRow>
      <Frame wide>
        <BottomBar>
          <ScrollingName text={selected ? selected.name : ""} />
          <Controls>A:VOLAR&nbsp;&nbsp;B:SALIR</Controls>
        </BottomBar>
      </Frame>
    </Container>
  );
};

export default FlyMenu;
