/**
 * SurfHandler — Pulsar A mirando un tile de agua inicia el Surf (MO03).
 * Va montado en Game.tsx fuera del BackgroundContainer.
 */
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  moveDown,
  moveLeft,
  moveRight,
  moveUp,
  selectDirection,
  selectMap,
  selectOnSurfing,
  selectPokemon,
  selectPos,
  setOnSurfing,
} from "../state/gameSlice";
import { selectMenuOpen, showTextThenAction } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { directionModifier, isFence, isWall, isWater } from "../app/map-helper";
import pokemonMetadata from "../app/pokemon-metadata";
import { Direction } from "../state/state-types";

const SurfHandler = () => {
  const dispatch = useDispatch();
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const map = useSelector(selectMap);
  const pokemon = useSelector(selectPokemon);
  const onSurfing = useSelector(selectOnSurfing);
  const menuOpen = useSelector(selectMenuOpen);

  useEvent(
    Event.A,
    useCallback(() => {
      if (menuOpen || onSurfing) return;

      const mod = directionModifier(facing);
      const adjX = pos.x + mod.x;
      const adjY = pos.y + mod.y;
      if (!isWater(map.water, adjX, adjY)) return;
      // La casilla de agua debe ser realmente transitable surfeando: si además
      // es muro o saliente, el movimiento se bloquearía y el jugador quedaría
      // "surfeando en tierra" (sprite de surf sin entrar al agua). En ese caso
      // no se inicia el surf, igual que en el juego original no habría agua ahí.
      if (isWall(map.walls, adjX, adjY) || isFence(map.fences, adjX, adjY)) return;

      const surfer = pokemon.find((p) => p.moves?.some((m) => m.id === "surf"));
      if (!surfer) return;

      const surferName = pokemonMetadata[surfer.id].name.toUpperCase();

      dispatch(
        showTextThenAction({
          text: [`¡${surferName} usó SURF!`],
          action: () => {
            dispatch(setOnSurfing(true));
            switch (facing) {
              case Direction.Left:  dispatch(moveLeft());  break;
              case Direction.Right: dispatch(moveRight()); break;
              case Direction.Up:    dispatch(moveUp());    break;
              case Direction.Down:  dispatch(moveDown());  break;
            }
          },
        })
      );
    }, [menuOpen, onSurfing, pos, facing, map, pokemon, dispatch])
  );

  return null;
};

export default SurfHandler;
