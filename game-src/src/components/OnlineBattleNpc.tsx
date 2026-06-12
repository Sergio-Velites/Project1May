import { useDispatch, useSelector } from "react-redux";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  selectDirection,
  selectMap,
  selectPos,
} from "../state/gameSlice";
import {
  selectCableClubMenu,
  selectMenuOpen,
  selectOnlineBattleMenu,
  showCableClubMenu,
} from "../state/uiSlice";
import { Direction } from "../state/state-types";

/**
 * OnlineBattleNpc — detects A-press in front of the Cable Club scientist
 * in any Pokemon Center that has `map.onlineBattleNpc` defined.
 * Opens the CLUB CABLE receptionist menu (live battle / trade / offline).
 * Renders nothing itself; the sprite is in map.trainers.
 */
const OnlineBattleNpc = () => {
  const dispatch = useDispatch();
  const pos = useSelector(selectPos);
  const direction = useSelector(selectDirection);
  const map = useSelector(selectMap);
  const menuOpen = useSelector(selectMenuOpen);
  const onlineMenuShown = useSelector(selectOnlineBattleMenu);
  const cableClubShown = useSelector(selectCableClubMenu);

  useEvent(Event.A, () => {
    // Bloquear si hay cualquier overlay abierto (texto, batalla, menús…).
    if (menuOpen || onlineMenuShown || cableClubShown) return;
    if (!map.onlineBattleNpc) return;
    // Solo desde el tile justo debajo y mirando hacia arriba.
    if (direction !== Direction.Up) return;
    if (pos.x !== map.onlineBattleNpc.x) return;
    if (pos.y - 1 !== map.onlineBattleNpc.y) return;
    dispatch(showCableClubMenu());
  });

  return null;
};

export default OnlineBattleNpc;
