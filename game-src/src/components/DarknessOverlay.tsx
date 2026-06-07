import styled from "styled-components";
import { useSelector } from "react-redux";
import { selectMap, selectFlashActive } from "../state/gameSlice";

/**
 * Oscuridad de cuevas (mapas `dark`, estilo Túnel Roca de Gen I).
 *
 * - Si el mapa es oscuro y la MO Destello NO está activa → se pinta una capa
 *   casi negra con un pequeño radio transparente centrado en el jugador
 *   (el jugador siempre está centrado en pantalla, así que el centro = 50/50).
 * - Al activar DESTELLO (`flashActive`) la capa desaparece y el mapa se ve
 *   por completo, fiel al original.
 *
 * Es puramente decorativo: `pointer-events: none` para no bloquear input.
 * Se renderiza como hermano de `ColorOverlay` (mismo contexto de apilado), de
 * modo que los menús, textos y combates posteriores en el DOM se pintan encima.
 */
const Mask = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0) 14%,
    rgba(0, 0, 0, 0.93) 30%,
    rgba(0, 0, 0, 0.97) 100%
  );
`;

const DarknessOverlay = () => {
  const map = useSelector(selectMap);
  const flashActive = useSelector(selectFlashActive);

  if (!map.dark || flashActive) return null;

  return <Mask />;
};

export default DarknessOverlay;
