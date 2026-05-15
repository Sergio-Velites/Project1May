import { useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  endFlyAnimation,
  selectFlyAnimation,
  setFlyPhase,
} from "../state/uiSlice";
import { flyTo } from "../state/gameSlice";

import birdUp from "../assets/walk-sprites/bird-up.png";
import birdUp1 from "../assets/walk-sprites/bird-up-1.png";
import birdUp2 from "../assets/walk-sprites/bird-up-2.png";
import birdDown from "../assets/walk-sprites/bird-down.png";
import birdDown1 from "../assets/walk-sprites/bird-down-1.png";
import birdDown2 from "../assets/walk-sprites/bird-down-2.png";

// Duración total de cada fase. Coincide con el tempo de Game Boy de la MO
// Vuelo: aproximadamente medio segundo de despegue, medio segundo de tránsito
// (pantalla negra) y otro medio segundo de aterrizaje.
const TAKEOFF_MS = 600;
const TRANSIT_MS = 400;
const LANDING_MS = 600;

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 200;
`;

// Capa de negro que aparece durante la transición (igual estética que
// MapChangeHandler para que sea coherente con las puertas/escaleras).
const BlackLayer = styled.div<{ $show: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: black;
  opacity: ${(p) => (p.$show ? 1 : 0)};
  transition: opacity 0.2s steps(3, end);
`;

const takeoff = keyframes`
  0%   { transform: translate(-50%, 0); opacity: 1; }
  100% { transform: translate(-50%, -260%); opacity: 0; }
`;

const landing = keyframes`
  0%   { transform: translate(-50%, -260%); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translate(-50%, 0); opacity: 1; }
`;

const BirdSprite = styled.img<{ $phase: "takeoff" | "landing" }>`
  position: absolute;
  left: 50%;
  top: 50%;
  width: 14%;
  max-width: 64px;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  animation: ${(p) => (p.$phase === "takeoff" ? takeoff : landing)}
    ${(p) => (p.$phase === "takeoff" ? TAKEOFF_MS : LANDING_MS)}ms steps(4, end)
    forwards;
`;

const TAKEOFF_FRAMES = [birdUp, birdUp1, birdUp2];
const LANDING_FRAMES = [birdDown, birdDown1, birdDown2];

const FlyAnimation = () => {
  const dispatch = useDispatch();
  const flyAnimation = useSelector(selectFlyAnimation);

  // Frame del aleteo (ciclo 3 frames cada ~80ms).
  // Como las fases son cortas, basta con un sprite estático medio cíclico.
  // Ver TAKEOFF_FRAMES / LANDING_FRAMES.
  // Para simplicidad, alternamos por timestamp en CSS (steps en keyframes).
  // Por eso aquí solo elegimos el sprite "principal".
  useEffect(() => {
    if (!flyAnimation) return;

    if (flyAnimation.phase === "takeoff") {
      const t = setTimeout(() => dispatch(setFlyPhase("transit")), TAKEOFF_MS);
      return () => clearTimeout(t);
    }

    if (flyAnimation.phase === "transit") {
      // Aplicamos el teletransporte y avanzamos a la fase de aterrizaje
      // tras un breve momento de pantalla en negro.
      const t = setTimeout(() => {
        dispatch(flyTo(flyAnimation.destination));
        dispatch(setFlyPhase("landing"));
      }, TRANSIT_MS);
      return () => clearTimeout(t);
    }

    if (flyAnimation.phase === "landing") {
      const t = setTimeout(() => dispatch(endFlyAnimation()), LANDING_MS);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyAnimation?.phase]);

  if (!flyAnimation) return null;

  const sprite =
    flyAnimation.phase === "takeoff"
      ? TAKEOFF_FRAMES[1]
      : flyAnimation.phase === "landing"
      ? LANDING_FRAMES[1]
      : null;

  return (
    <Container>
      <BlackLayer $show={flyAnimation.phase === "transit"} />
      {sprite && (
        <BirdSprite
          src={sprite}
          alt="bird"
          $phase={flyAnimation.phase === "takeoff" ? "takeoff" : "landing"}
        />
      )}
    </Container>
  );
};

export default FlyAnimation;
