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
//   ask     → muestra preMessage + menú SÍ/NO
//   running → confirm() asíncrono en curso (p.ej. guardado verificado)
//   done    → muestra el mensaje final (postMessage o el devuelto por confirm)
type Phase = "ask" | "running" | "done";

const ConfirmationMenu = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();
  const data = useSelector(selectConfirmationMenu);

  const [phase, setPhase] = useState<Phase>("ask");
  // Mensaje final dinámico (cuando confirm() resuelve a un string). Si es null
  // se usa data.postMessage.
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  // Evita ejecutar confirm() dos veces (doble A).
  const runningRef = useRef(false);

  const show = !!data;

  // Reinicio total al abrir/cerrar el menú.
  useEffect(() => {
    if (!show) {
      setPhase("ask");
      setResultMessage(null);
      runningRef.current = false;
    }
  }, [show]);

  const preText = data?.preMessage ?? "";
  const pendingText = data?.pendingMessage ?? "Guardando...";
  const postText = resultMessage ?? data?.postMessage ?? "";

  // Texto que se anima según la fase.
  const activeText =
    phase === "ask" ? preText : phase === "running" ? pendingText : postText;

  // Lanza la acción de confirmación. Soporta confirm() síncrono o asíncrono.
  const runConfirm = () => {
    if (!data || runningRef.current) return;
    runningRef.current = true;

    let outcome: void | Promise<string | void>;
    try {
      outcome = data.confirm();
    } catch {
      // confirm() síncrono que lanzó → tratamos como error genérico.
      outcome = undefined;
    }

    const isPromise =
      !!outcome && typeof (outcome as Promise<unknown>).then === "function";

    if (!isPromise) {
      // Comportamiento clásico: mostrar postMessage directamente.
      setPhase("done");
      return;
    }

    // Asíncrono: mostrar "Guardando..." mientras resolvemos.
    setPhase("running");
    (outcome as Promise<string | void>)
      .then((msg) => {
        if (typeof msg === "string" && msg) setResultMessage(msg);
        setPhase("done");
      })
      .catch(() => {
        // No debería ocurrir (saveGameVerified no lanza), pero por seguridad
        // mostramos el postMessage por defecto.
        setPhase("done");
      });
  };

  const line = useDialogLine({
    text: activeText,
    enabled: show,
    onAdvance: () => {
      // Solo se puede cerrar la caja cuando el proceso terminó.
      // En "running" A/B únicamente completan el typewriter (no cierran).
      if (phase === "done") dispatch(hideConfirmationMenu());
    },
  });

  if (!show) return null;

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
