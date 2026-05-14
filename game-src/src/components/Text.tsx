import { useDispatch, useSelector } from "react-redux";
import styled, { keyframes } from "styled-components";
import {
  selectDirection,
  selectPos,
  selectMap,
  selectMapId,
  selectCompletedQuests,
} from "../state/gameSlice";
import { useRef, useState } from "react";
import useEvent from "../app/use-event";
import emitter, { Event } from "../app/emitter";
import useDialogLine from "../app/use-dialog-line";
import {
  hideText,
  selectMenuOpen,
  selectText,
  showText,
  openTextReward,
} from "../state/uiSlice";
import { Direction } from "../state/state-types";
import { useActiveMapQuests } from "../app/use-quests";
import PixelImage from "../styles/PixelImage";

interface TextProps {
  $done: boolean;
}

// Flashing animation
const flashing = keyframes`
  0% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
`;

const StyledText = styled.div<TextProps>`
  position: absolute !important;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 30%;
  background: var(--bg);
  z-index: 1000;

  h1 {
    color: black;
    font-size: 2.4cqw;
    font-family: "PokemonGB";
  }

  ::after {
    content: "";
    position: absolute;
    bottom: ${(props) => (props.$done ? "3.5cqw" : "-100px")};
    right: 2.7cqw;
    width: 0.35cqw;
    height: 0.35cqw;
    font-size: 0.35cqw;
    color: #181010;
    box-shadow: 1em 0em 0 #181010, 2em 0em 0 #181010, 1em 1em 0 #181010,
      2em 1em 0 #181010, 3em 1em 0 #181010, 1em 2em 0 #181010, 2em 2em 0 #181010,
      3em 2em 0 #181010, 4em 2em 0 #181010, 1em 3em 0 #181010, 2em 3em 0 #181010,
      3em 3em 0 #181010, 4em 3em 0 #181010, 5em 3em 0 #181010, 1em 4em 0 #181010,
      2em 4em 0 #181010, 3em 4em 0 #181010, 4em 4em 0 #181010, 1em 5em 0 #181010,
      2em 5em 0 #181010, 3em 5em 0 #181010, 1em 6em 0 #181010, 2em 6em 0 #181010;
    transform: rotate(90deg);
    animation: ${flashing} 1s infinite;
  }
`;

const Image = styled(PixelImage)`
  height: 60%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Text = () => {
  const dispatch = useDispatch();
  const [textIndex, setTextIndex] = useState(0);
  const pos = useSelector(selectPos);
  const direction = useSelector(selectDirection);
  const map = useSelector(selectMap);
  const menuOpen = useSelector(selectMenuOpen);
  const text = useSelector(selectText);
  const mapId = useSelector(selectMapId);
  const completedQuests = useSelector(selectCompletedQuests);
  const quests = useActiveMapQuests(mapId);

  // Guarda el tile que originó el texto actual (solo para tiles de mapa).
  // Se usa al cerrar el último frame para comprobar si hay recompensa pendiente.
  const currentTextTileRef = useRef<{ x: number; y: number } | null>(null);

  // Si la entrada es una imagen (path largo), salta el typewriter.
  const currentLine = text?.[textIndex] ?? "";
  const isImage = currentLine.length > 300;

  // Hook compartido: typewriter + avance A/B + cooldown 300 ms.
  // Solo activo cuando hay texto Y la línea actual es texto (no imagen).
  const { displayed, isComplete } = useDialogLine({
    text: currentLine,
    enabled: !!text && !isImage,
    onAdvance: () => {
      if (!text) return;
      if (textIndex === text.length - 1) {
        const tile = currentTextTileRef.current;
        currentTextTileRef.current = null;
        setTextIndex(0);
        dispatch(hideText());
        if (tile) {
          const reward = map.textRewards?.[tile.y]?.[tile.x];
          if (reward && !completedQuests.includes(reward.questId)) {
            dispatch(openTextReward(reward));
          }
        }
      } else {
        setTextIndex((prev) => prev + 1);
      }
    },
  });

  // Para imágenes (sin typewriter): A las cierra/avanza directamente.
  useEvent(Event.A, () => {
    if (text && isImage) {
      if (textIndex === text.length - 1) {
        currentTextTileRef.current = null;
        setTextIndex(0);
        dispatch(hideText());
      } else {
        setTextIndex((prev) => prev + 1);
      }
      return;
    }

    // Si hay texto en curso, el hook se encarga del avance.
    if (text) return;

    if (menuOpen) return;

    // Getting coords in front of character
    let { x, y } = pos;
    switch (direction) {
      case Direction.Down:
        y += 1;
        break;
      case Direction.Up:
        y -= 1;
        break;
      case Direction.Left:
        x -= 1;
        break;
      case Direction.Right:
        x += 1;
        break;
    }

    // If there is a quest at this position, don't open text
    if (quests.length > 0) {
      const isQuest = quests.some((quest) => {
        if (quest.trigger !== "talk") return false;
        const yPos = quest.positions[y];
        if (!yPos) return false;
        if (!yPos.includes(x)) return false;
        return true;
      });
      if (isQuest) return;
    }

    // Open new textbox
    if (map.text[y] && map.text[y][x] && map.text[y][x].length > 0) {
      // Si este tile tiene recompensa y ya fue tomada, no volver a abrir
      const reward = map.textRewards?.[y]?.[x];
      if (reward && completedQuests.includes(reward.questId)) return;

      currentTextTileRef.current = { x, y };
      emitter.emit(Event.StopMoving);
      dispatch(showText(map.text[y][x]));
    }
  });

  if (!text) return null;

  return (
    <>
      {isImage ? (
        <Image src={currentLine} />
      ) : (
        <StyledText className="framed no-hd" $done={isComplete}>
          <h1>{displayed}</h1>
        </StyledText>
      )}
    </>
  );
};

export default Text;
