import { useEffect, useRef, useState } from "react";
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

// Fases del flujo de confirmación:
//   ask     → preMessage + menú SÍ/NO
//   running → confirm() asíncrono en curso (pendingMessage)
//   done    → páginas de resultado (una o varias, avance con A/B)
type Phase = "ask" | "running" | "done";

const ConfirmationMenu = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const data = useSelector(selectConfirmationMenu);

  const [phase, setPhase] = useState<Phase>("ask");
  // Páginas del resultado. Vacío → usar [data.postMessage] como fallback.
  const [resultPages, setResultPages] = useState<string[]>([]);
  // Índice de la página actual dentro de resultPages.
  const [pageIdx, setPageIdx] = useState(0);
  const runningRef = useRef(false);

  // Reinicio total al cerrar el menú.
  useEffect(() => {
    if (!data) {
      setPhase("ask");
      setResultPages([]);
      setPageIdx(0);
      runningRef.current = false;
    }
  }, [data]);

  const preText     = data?.preMessage ?? "";
  const pendingText = data?.pendingMessage ?? "Guardando...";

  // Páginas a mostrar en fase done (resultado de confirm() o postMessage fallback).
  const donePages: string[] =
    resultPages.length > 0 ? resultPages : [data?.postMessage ?? ""];
  const postText = donePages[pageIdx] ?? "";

  const activeText =
    phase === "ask" ? preText : phase === "running" ? pendingText : postText;

  const runConfirm = () => {
    if (!data || runningRef.current) return;
    runningRef.current = true;

    let outcome: void | Promise<string | string[] | void>;
    try {
      outcome = data.confirm();
    } catch {
      outcome = undefined;
    }

    const isPromise =
      !!outcome && typeof (outcome as Promise<unknown>).then === "function";

    if (!isPromise) {
      setPhase("done");
      return;
    }

    setPhase("running");
    (outcome as Promise<string | string[] | void>)
      .then((msg) => {
        if (Array.isArray(msg) && msg.length > 0) {
          setResultPages(msg as string[]);
        } else if (typeof msg === "string" && msg) {
          setResultPages([msg]);
        }
        setPhase("done");
      })
      .catch(() => {
        setPhase("done");
      });
  };

  const line = useDialogLine({
    text: activeText,
    enabled: !!data,
    onAdvance: () => {
      if (phase !== "done") return;
      // Hay más páginas: avanzar a la siguiente.
      if (pageIdx < donePages.length - 1) {
        setPageIdx((p) => p + 1);
        return;
      }
      // Última página: cerrar.
      dispatch(hideConfirmationMenu());
    },
  });

  if (!data) return null;

  return (
    <>
      <Container>
        <Frame
          wide
          tall
          flashing={phase === "done" ? line.isComplete : false}
        >
          {line.displayed}
        </Frame>
      </Container>
      <Menu
        left="0"
        padding="1vw"
        bottom={isMobile ? "30%" : "20%"}
        show={phase === "ask" && line.isComplete}
        close={() => {}}
        noExit
        menuItems={[
          {
            label: "SÍ",
            action: () => runConfirm(),
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
