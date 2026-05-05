import { useDispatch, useSelector } from "react-redux";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import {
  selectMap,
  selectPos,
} from "../state/gameSlice";
import {
  selectStartMenu,
  showOnlineBattleMenu,
} from "../state/uiSlice";

/**
 * OnlineBattleNpc — detects A-press in front of the online-battle scientist
 * in any Pokemon Center that has `map.onlineBattleNpc` defined.
 * Renders nothing itself; the sprite is in map.trainers.
 */
const OnlineBattleNpc = () => {
  const dispatch = useDispatch();
  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);
  const startMenuOpen = useSelector(selectStartMenu);

  useEvent(Event.A, () => {
    if (startMenuOpen) return;

    if (
      map.onlineBattleNpc &&
      pos.y - 1 === map.onlineBattleNpc.y &&
      pos.x === map.onlineBattleNpc.x
    ) {
      dispatch(showOnlineBattleMenu());
    }
  });

  return null;
};

export default OnlineBattleNpc;
