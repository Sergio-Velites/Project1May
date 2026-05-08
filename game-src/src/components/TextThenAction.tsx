import styled from "styled-components";
import Frame from "./Frame";
import { useDispatch, useSelector } from "react-redux";
import { hideTextThenAction, selectTextThenAction } from "../state/uiSlice";
import { useEffect, useRef, useState } from "react";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";

const StyledTextThenAction = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  z-index: 100;
`;

const TextThenAction = () => {
  const dispatch = useDispatch();
  const textThenAction = useSelector(selectTextThenAction);
  const [textIndex, setTextIndex] = useState(0);
  const [liveIndex, setLiveIndex] = useState(0);
  const closedAtRef = useRef(0);
  const CLOSE_COOLDOWN = 400;

  useEffect(() => {
    if (textThenAction) return;
    setTextIndex(0);
  }, [textThenAction]);

  // Reiniciar typewriter al cambiar de línea o de texto
  useEffect(() => {
    setLiveIndex(0);
    if (!textThenAction) return;
    const interval = setInterval(() => {
      setLiveIndex((prev) => prev + 1);
    }, 30);
    return () => clearInterval(interval);
  }, [textThenAction, textIndex]);

  const advance = () => {
    if (!textThenAction) return;
    const currentLine = textThenAction.text[textIndex] ?? "";
    // Typewriter no terminado → mostrar completo, no avanzar
    if (liveIndex < currentLine.length) {
      setLiveIndex(currentLine.length);
      return;
    }
    // Cooldown: evita doble-acción con el mismo 'A'
    const now = Date.now();
    if (now - closedAtRef.current < CLOSE_COOLDOWN) return;
    closedAtRef.current = now;

    if (textIndex === textThenAction.text.length - 1) {
      textThenAction.action();
      dispatch(hideTextThenAction());
    } else {
      setTextIndex(textIndex + 1);
    }
  };

  useEvent(Event.A, advance);
  useEvent(Event.B, advance);

  if (!textThenAction) return null;

  const currentLine = textThenAction.text[textIndex] ?? "";
  const isComplete = liveIndex >= currentLine.length;

  return (
    <StyledTextThenAction>
      <Frame wide tall flashing={isComplete}>
        {currentLine.substring(0, liveIndex)}
      </Frame>
    </StyledTextThenAction>
  );
};

export default TextThenAction;
