import styled from "styled-components";
import Frame from "./Frame";
import { useDispatch, useSelector } from "react-redux";
import { hideTextThenAction, selectTextThenAction } from "../state/uiSlice";
import { useEffect, useState } from "react";
import useDialogLine from "../app/use-dialog-line";

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

  useEffect(() => {
    if (textThenAction) return;
    setTextIndex(0);
  }, [textThenAction]);

  const lines = textThenAction?.text ?? [];
  const currentLine = lines[textIndex] ?? "";

  const { displayed, isComplete } = useDialogLine({
    text: currentLine,
    enabled: !!textThenAction,
    onAdvance: () => {
      if (!textThenAction) return;
      if (textIndex === textThenAction.text.length - 1) {
        textThenAction.action();
        dispatch(hideTextThenAction());
        return;
      }
      setTextIndex(textIndex + 1);
    },
  });

  if (!textThenAction) return null;

  return (
    <StyledTextThenAction>
      <Frame wide tall flashing={isComplete}>
        {displayed}
      </Frame>
    </StyledTextThenAction>
  );
};

export default TextThenAction;
