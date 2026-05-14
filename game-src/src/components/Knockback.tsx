/**
 * Knockback — Empuja al jugador hacia atrás (sentido opuesto a `direction`)
 * a velocidad doble de la marcha normal hasta chocar con wall/fence/water/borde.
 *
 * Uso típico: el jugador lanza la caña a un NPC → trainer responde y
 * "rebota" al jugador unos cuantos tiles hacia atrás como gag visual.
 *
 * Bloquea inputs (selectMenuOpen incluye knockback). Cap de seguridad
 * en MAX_STEPS para evitar bucles infinitos en mapas extraños.
 */
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectKnockback, endKnockback } from "../state/uiSlice";
import { selectMap, selectPos, setPos } from "../state/gameSlice";
import { Direction, PosType } from "../state/state-types";
import { MapType } from "../maps/map-types";
import { MOVE_SPEED } from "../app/constants";
import { isWall, isFence, isWater } from "../app/map-helper";

const KNOCKBACK_SPEED = MOVE_SPEED / 2; // 2× rápido que andar normal
const MAX_STEPS = 20;

const reverse = (d: Direction): Direction => {
  switch (d) {
    case Direction.Up:
      return Direction.Down;
    case Direction.Down:
      return Direction.Up;
    case Direction.Left:
      return Direction.Right;
    case Direction.Right:
      return Direction.Left;
  }
};

const dirVec = (d: Direction): PosType => {
  switch (d) {
    case Direction.Up:
      return { x: 0, y: -1 };
    case Direction.Down:
      return { x: 0, y: 1 };
    case Direction.Left:
      return { x: -1, y: 0 };
    case Direction.Right:
      return { x: 1, y: 0 };
  }
};

/**
 * ¿Se puede empujar al tile (x,y)? Bloquea wall/fence/water/borde.
 * No comprueba items/npcs (el rebote es corto y rara vez hay obstáculos
 * detrás del jugador).
 */
const canKnockTo = (map: MapType, x: number, y: number): boolean => {
  if (x < 0 || y < 0) return false;
  if (x >= map.width || y >= map.height) return false;
  if (isWall(map.walls, x, y)) return false;
  if (isFence(map.fences, x, y)) return false;
  if (isWater(map.water, x, y)) return false;
  return true;
};

const Knockback = () => {
  const dispatch = useDispatch();
  const knockback = useSelector(selectKnockback);
  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);

  // Refs sincronizadas para que el intervalo siempre lea el estado actual.
  const posRef = useRef(pos);
  const mapRef = useRef(map);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);
  useEffect(() => {
    mapRef.current = map;
  }, [map]);

  useEffect(() => {
    if (!knockback) return;

    const pushDir = reverse(knockback.direction);
    const vec = dirVec(pushDir);
    let steps = 0;

    const interval = setInterval(() => {
      const currentPos = posRef.current;
      const currentMap = mapRef.current;
      const nx = currentPos.x + vec.x;
      const ny = currentPos.y + vec.y;

      if (!canKnockTo(currentMap, nx, ny)) {
        clearInterval(interval);
        dispatch(endKnockback());
        return;
      }

      dispatch(setPos({ x: nx, y: ny }));
      steps += 1;
      if (steps >= MAX_STEPS) {
        clearInterval(interval);
        dispatch(endKnockback());
      }
    }, KNOCKBACK_SPEED);

    return () => {
      clearInterval(interval);
    };
  }, [knockback, dispatch]);

  return null;
};

export default Knockback;
