import { useEffect, useState } from "react";
import styled from "styled-components";
import Frame from "./Frame";
import Menu from "./Menu";
import useDialogLine from "../app/use-dialog-line";
import useIsMobile from "../app/use-is-mobile";
import { useDispatch, useSelector } from "react-redux";
import { hideConfirmationMenu, selectConfirmationMenu } from "../state/uiSlice";

const Container = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20%;
  z-index: 100;

  @media (max-width: 1000px) {
    height: 30%;
  }
`;

const ConfirmationMenu = () => {
  const dispatch = useDispatch();
  const [confirmed, setConfirmed] = useState(false);
  const isMobile = useIsMobile();
  const data = useSelector(selectConfirmationMenu);

  const show = !!data;

  useEffect(() => {
    if (!show) setConfirmed(false);
  }, [show]);

  const preText = data?.preMessage ?? "";
  const postText = data?.postMessage ?? "";

  // Typewriter del preMessage. NO avanza nada por sí solo —
  // solo actúa como "skip-typewriter" con A/B. El menú navega cuando termina.
  const pre = useDialogLine({
    text: preText,
    enabled: show && !confirmed,
    onAdvance: () => {
      // Sin acción extra: tras el cooldown, A será capturado por el menú.
    },
  });

  // Typewriter del postMessage: A/B (con cooldown) cierra el menú.
  const post = useDialogLine({
    text: postText,
    enabled: show && confirmed,
    onAdvance: () => {
      dispatch(hideConfirmationMenu());
    },
  });

  if (!show) return null;

  return (
    <>
      <Container>
        <Frame wide tall flashing={confirmed ? post.isComplete : pre.isComplete}>
          {confirmed ? post.displayed : pre.displayed}
        </Frame>
      </Container>
      <Menu
        left="0"
        padding="1vw"
        bottom={isMobile ? "30%" : "20%"}
        show={!confirmed && pre.isComplete}
        close={() => setConfirmed(true)}
        noExit
        menuItems={[
          {
            label: "SÍ",
            action: () => {
              setConfirmed(true);
              data.confirm();
            },
          },
          {
            label: "NO",
            action: () => {
              if (data.cancel) data.cancel();
              dispatch(hideConfirmationMenu());
            },
          },
        ]}
      />
    </>
  );
};

export default ConfirmationMenu;
