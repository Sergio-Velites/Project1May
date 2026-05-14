import { useSelector } from "react-redux";
import { selectOnBicycle } from "../state/gameSlice";
import { MOVE_SPEED, WALK_SPEED } from "./constants";

/**
 * Velocidad de movimiento adaptada a si el jugador va en bici.
 * Bicicleta = ×2 velocidad → MOVE_SPEED / 2.
 *
 * Se usa en MovementHandler (intervalos de tick) y Character
 * (transición CSS + ciclo de animación de pasos).
 */
const useMoveSpeed = () => {
  const onBicycle = useSelector(selectOnBicycle);
  return {
    moveSpeed: onBicycle ? MOVE_SPEED / 2 : MOVE_SPEED,
    walkSpeed: onBicycle ? WALK_SPEED / 2 : WALK_SPEED,
    onBicycle,
  };
};

export default useMoveSpeed;
