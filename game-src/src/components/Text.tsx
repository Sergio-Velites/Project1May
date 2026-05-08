import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import {
  selectDirection,
  selectPos,
  selectMap,
  selectMapId,
} from "../state/gameSlice";
import { useEffect, useRef, useState } from "react";
import useEvent from "../app/use-event";
import emitter, { Event } from "../app/emitter";
import {
  hideText,
  selectMenuOpen,
  selectText,
  showText,
} from "../state/uiSlice";
import { Direction } from "../state/state-types";
import { useActiveMapQuests } from "../app/use-quests";
import PixelImage from "../styles/PixelImage";
import Frame from "./Frame";

// Contenedor posicionado — ocupa el 30% inferior del display, siempre.
// El Frame interior (cqw) gestiona border, padding, fuente y flecha.
const StyledTextContainer = styled.div`
  position: absolute !important;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 30%;
  z-index: 1000;
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
  const [liveIndex, setLiveIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const pos = useSelector(selectPos);
  const direction = useSelector(selectDirection);
  const map = useSelector(selectMap);
  const menuOpen = useSelector(selectMenuOpen);
  const text = useSelector(selectText);
  const mapId = useSelector(selectMapId);
  const quests = useActiveMapQuests(mapId);

  // Timestamp del último cierre de texto — para cooldown post-close
  const closedAtRef = useRef(0);
  const CLOSE_COOLDOWN = 400;

  useEffect(() => {
    setLiveIndex(0);
    if (text) {
      const interval = setInterval(() => {
        setLiveIndex((prev) => prev + 1);
      }, 30);

      return () => clearInterval(interval);
    }
  }, [text, textIndex]);

  // Avanza el texto: si el typewriter no ha terminado, lo completa.
  // Si ya terminó, pasa a la siguiente línea o cierra el cuadro.
  // Devuelve true si había texto activo (para cortocircuitar el handler del mundo).
  const advanceText = () => {
    if (!text) return false;
    const currentLine = text[textIndex];
    if (liveIndex < currentLine.length) {
      setLiveIndex(currentLine.length);
      return true;
    }
    if (textIndex === text.length - 1) {
      closedAtRef.current = Date.now();
      setTextIndex(0);
      dispatch(hideText());
    } else {
      setTextIndex((prev) => prev + 1);
    }
    return true;
  };

  useEvent(Event.B, () => {
    advanceText();
  });

  useEvent(Event.A, () => {
    // Cooldown post-cierre: evita que el mismo 'A' que cerró el texto
    // active inmediatamente una acción en el mundo.
    if (Date.now() - closedAtRef.current < CLOSE_COOLDOWN) return;

    if (advanceText()) return;

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
      emitter.emit(Event.StopMoving);
      dispatch(showText(map.text[y][x]));
    }
  });

  if (!text) return null;

  const currentLine = text[textIndex];
  const isDone = liveIndex >= currentLine.length;

  return (
    <StyledTextContainer>
      {currentLine.length > 300 ? (
        <Image src={currentLine} />
      ) : (
        <Frame wide tall flashing={isDone}>
          {currentLine.substring(0, liveIndex)}
        </Frame>
      )}
    </StyledTextContainer>
  );
};

export default Text;
