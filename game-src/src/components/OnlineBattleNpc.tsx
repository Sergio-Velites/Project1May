import { useDispatch, useSelector } from "react-redux";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  selectMap,
  selectPos,
  selectDirection,
} from "../state/gameSlice";
import {
  selectMenuOpen,
  showOnlineBattleMenu,
  showTextThenAction,
} from "../state/uiSlice";
import { Direction } from "../state/state-types";

/**
 * OnlineBattleNpc — detects A-press in front of the online-battle scientist
 * in any Pokemon Center that has `map.onlineBattleNpc` defined.
 * Renders nothing itself; the sprite is in map.trainers.
 */
const OnlineBattleNpc = () => {
  const dispatch = useDispatch();
  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);
  const direction = useSelector(selectDirection);
  const menuOpen = useSelector(selectMenuOpen);

  useEvent(Event.A, () => {
    // No abrir si ya hay cualquier menú abierto
    if (menuOpen) return;
    // El jugador debe estar mirando hacia el NPC (hacia arriba)
    if (direction !== Direction.Up) return;

    if (
      map.onlineBattleNpc &&
      pos.y - 1 === map.onlineBattleNpc.y &&
      pos.x === map.onlineBattleNpc.x
    ) {
      // Usar el sistema de texto estándar (typewriter) para el saludo,
      // igual que el resto de NPCs. Al pulsar A se abre el menú de batalla.
      dispatch(
        showTextThenAction({
          text: ["¡Hola, invitado!  ¿Quieres combatir con el equipo Pokémon de otro invitado?"],
          action: () => dispatch(showOnlineBattleMenu()),
        })
      );
    }
  });

  return null;
};

export default OnlineBattleNpc;
