import { useDispatch, useSelector } from "react-redux";
import { selectDirection, selectMapId, selectPos } from "../state/gameSlice";
import { useActiveMapQuests } from "../app/use-quests";
import { useEffect } from "react";
import { selectMenuOpen, selectTextThenAction, showTextThenAction } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import { directionModifier } from "../app/map-helper";

const QuestHandler = () => {
  const dispatch = useDispatch();
  const mapId = useSelector(selectMapId);
  const quests = useActiveMapQuests(mapId);
  const pos = useSelector(selectPos);
  const facing = useSelector(selectDirection);
  const menuOpen = useSelector(selectMenuOpen);
  // Solo despachar si no hay texto activo (evita bucle infinito:
  // quests es un array nuevo en cada render → effect se re-ejecuta → dispatch → re-render...)
  const textThenAction = useSelector(selectTextThenAction);

  useEffect(() => {
    // Nunca despachar mientras hay texto u otro menú abierto — evita el bucle:
    // each render creates a new `quests` reference → effect fires again → dispatch → render...
    if (menuOpen || textThenAction) return;

    quests.forEach((quest) => {
      if (quest.trigger !== "walk") return;
      const yPos = quest.positions[pos.y];
      if (!yPos) return;
      if (!yPos.includes(pos.x)) return;
      dispatch(
        showTextThenAction({
          text: quest.text,
          action: () => quest.action(),
        })
      );
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, mapId]);
  // Nota: se usa [pos, mapId] y NO [quests] para evitar que el effect se ejecute en cada
  // render (quests es un nuevo array en cada render porque useQuests() lo crea inline).

  useEvent(Event.A, () => {
    if (menuOpen) return;
    const mod = directionModifier(facing);
    const questPos = { x: pos.x + mod.x, y: pos.y + mod.y };
    quests.forEach((quest) => {
      if (quest.trigger !== "talk") return;
      const yPos = quest.positions[questPos.y];
      if (!yPos) return;
      if (!yPos.includes(questPos.x)) return;
      dispatch(
        showTextThenAction({
          text: quest.text,
          action: () => quest.action(),
        })
      );
    });
  });

  return null;
};

export default QuestHandler;
