import styled, { keyframes } from "styled-components";
import Menu from "./Menu";
import Frame from "./Frame";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadFromState } from "../state/gameSlice";
import {
  hideLoadMenu,
  selectGameboyMenu,
  selectLoadMenu,
  selectTitleMenu,
} from "../state/uiSlice";
import {
  isWebAuthnAvailable,
  webauthnAuth,
  webauthnRegister,
  loadFromCloud,
  createUser,
  setCurrentUserId,
  setImpersonatedUserId,
} from "../app/cloud-save";
import OakIntro from "./OakIntro";
import { GameState } from "../state/state-types";

const pulse = keyframes`
  0%   { opacity: 1; }
  50%  { opacity: 0.3; }
  100% { opacity: 1; }
`;

const StyledLoadScreen = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 1000;
  background: var(--bg);
`;

const TextArea = styled.div`
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

interface FlashProps {
  $flashing: boolean;
}

const StatusText = styled.h1<FlashProps>`
  font-family: "PokemonGB";
  font-size: 30px;
  color: black;
  padding: 16px 18px;
  animation: ${(p) => (p.$flashing ? pulse : "none")} 1.2s infinite;

  @media (max-width: 1000px) {
    font-size: 9px;
    padding: 6px 10px;
  }
`;

// Fases de la secuencia de arranque. Las fases "idle" y "bootstrapping" muestran
// solo la pantalla de carga; las fases interactivas aparecen DESPUÉS de que el
// TitleScreen se haya cerrado, con un guard timer para evitar selecciones accidentales.
type Phase =
  | "idle"
  | "bootstrapping"
  | "require-passkey"
  | "registering"
  | "choose"
  | "oak-intro";

const LoadScreen = () => {
  const dispatch = useDispatch();
  const titleOpen = useSelector(selectTitleMenu);
  const show = useSelector(selectLoadMenu);
  const gameboyOpen = useSelector(selectGameboyMenu);

  const [phase, setPhase] = useState<Phase>("idle");
  // menuReady: false hasta 500 ms después de entrar en una fase interactiva.
  // Previene que el botón A que cerró el TitleScreen seleccione una opción.
  const [menuReady, setMenuReady] = useState(false);
  const cloudSave = useRef<GameState | null>(null);
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guard atómico: previene que un doble-click o un closure stale dispare
  // handleNewGame tras haber ya ejecutado handleContinue (o viceversa).
  const choosingRef = useRef(false);
  // UUID a impersonar leído de la URL (?play_as= o ?recover=). Se mantiene en
  // un ref para no recalcular search params en cada render.
  const impersonationRef = useRef<{
    userId: string;
    mode: "play_as" | "recover";
  } | null>(null);
  // Mensaje de estado tras vincular dispositivo en modo recover.
  const [linkedMsg, setLinkedMsg] = useState<string | null>(null);

  const loadComplete = () => {
    setTimeout(() => dispatch(hideLoadMenu()), 300);
  };

  // Transiciona a una fase interactiva. Si la fase muestra un menú, activa el
  // guard timer: el menú solo acepta input 500 ms después de aparecer.
  const transitionTo = (p: Phase) => {
    if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    choosingRef.current = false; // Resetear guard al entrar en cualquier fase nueva
    setMenuReady(false);
    setPhase(p);
    if (p === "require-passkey" || p === "choose") {
      readyTimerRef.current = setTimeout(() => setMenuReady(true), 500);
    }
  };

  // Bootstrap: verifica credenciales y carga partida. Solo se llama una vez,
  // DESPUÉS de que el TitleScreen se cierre, para que la secuencia de pantallas
  // sea estrictamente: GameboyMenu → Video → TitleScreen → passskey/choose.
  const runBootstrap = async () => {
    // ── Modo impersonación desde admin (?play_as=UUID o ?recover=UUID) ──
    // Salta passkey y carga directamente la partida del UUID indicado.
    try {
      const search = new URLSearchParams(window.location.search);
      const playAs = search.get("play_as");
      const recover = search.get("recover");
      const target = (recover || playAs)?.trim();
      const mode: "play_as" | "recover" | null = recover
        ? "recover"
        : playAs
        ? "play_as"
        : null;
      // UUID v4 simple validation — impersonation only in non-production
      if (
        target &&
        mode &&
        process.env.NODE_ENV !== "production" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          target
        )
      ) {
        impersonationRef.current = { userId: target, mode };
        setImpersonatedUserId(target, mode);
        const save = await loadFromCloud(target);
        if (save) {
          cloudSave.current = save as GameState;
          transitionTo("choose");
        } else {
          // Sin save → solo nueva partida (raro en impersonación, pero soportado)
          transitionTo("oak-intro");
        }
        return;
      }
    } catch {
      // si algo falla, caer al flujo normal
    }

    const userId = localStorage.getItem("wedding_user_id");
    const credentialId = localStorage.getItem("wedding_credential_id");
    const webAuthnOk = isWebAuthnAvailable();

    if (userId && credentialId && webAuthnOk) {
      const authedId = await webauthnAuth(credentialId);
      if (authedId) {
        setCurrentUserId(authedId);
        const save = await loadFromCloud(authedId);
        if (save) {
          cloudSave.current = save as GameState;
          transitionTo("choose");
          return;
        }
        transitionTo("oak-intro");
        return;
      }
      transitionTo("require-passkey");
      return;
    }

    if (!webAuthnOk) {
      if (userId) {
        setCurrentUserId(userId);
        const save = await loadFromCloud(userId);
        if (save) {
          cloudSave.current = save as GameState;
          transitionTo("choose");
          return;
        }
      } else {
        const newId = await createUser();
        if (newId) setCurrentUserId(newId);
      }
      transitionTo("oak-intro");
      return;
    }

    transitionTo("require-passkey");
  };

  // Arranca el bootstrap solo cuando el TitleScreen se cierra (y el juego aún no
  // ha empezado). Esto garantiza que la pantalla de passkey/choose aparece siempre
  // DESPUÉS del TitleScreen y nunca interfiere con sus eventos de teclado.
  useEffect(() => {
    if (!show) return;
    if (titleOpen !== false) return; // esperar a que se cierre el TitleScreen
    if (phase !== "idle") return;    // no relanzar si ya está en marcha

    setPhase("bootstrapping");
    runBootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, titleOpen]);

  // Limpieza del timer al desmontar
  useEffect(() => {
    return () => {
      if (readyTimerRef.current) clearTimeout(readyTimerRef.current);
    };
  }, []);

  if (!show) return null;

  // Mientras el GameboyMenu o el TitleScreen estén visibles, este componente no
  // renderiza nada. Esto es CRÍTICO: evita que los useEvent del Menu estén activos
  // y que el botón A de esas pantallas provoque selecciones accidentales aquí.
  if (gameboyOpen || titleOpen) return null;

  // ---- Intro del Prof. Oak (autónomo: gestiona nombre + RSVP) ----
  if (phase === "oak-intro") {
    return (
      <StyledLoadScreen>
        <OakIntro onComplete={loadComplete} />
      </StyledLoadScreen>
    );
  }

  // ---- Pantalla de carga (idle / bootstrapping / registering) ----
  if (phase === "idle" || phase === "bootstrapping" || phase === "registering") {
    return (
      <StyledLoadScreen>
        <TextArea>
          <Frame>
            <StatusText $flashing>WEDDINGBOY...</StatusText>
          </Frame>
        </TextArea>
      </StyledLoadScreen>
    );
  }

  // ---- Registro / autenticación passkey ----
  if (phase === "require-passkey") {
    return (
      <StyledLoadScreen>
        <TextArea>
          <Frame>
            <StatusText $flashing={false}>
              Activa guardado para confirmar asistencia.
            </StatusText>
          </Frame>
        </TextArea>
        <Menu
          show={menuReady}
          disabled={!menuReady}
          noExit
          top="2px"
          left="2px"
          padding="7vw"
          close={() => {}}
          menuItems={[
            {
              label: "Guardar con Face ID/Huella",
              action: async () => {
                setPhase("registering");
                setMenuReady(false);
                try {
                  const credentialId = localStorage.getItem("wedding_credential_id");
                  let userId: string | null = null;
                  if (credentialId) {
                    userId = await webauthnAuth(credentialId);
                  }
                  if (!userId) {
                    userId = await webauthnRegister();
                  }
                  if (userId) {
                    setCurrentUserId(userId);
                    const save = await loadFromCloud(userId);
                    if (save) {
                      cloudSave.current = save as GameState;
                      transitionTo("choose");
                      return;
                    }
                    transitionTo("oak-intro");
                  } else {
                    // Registro falló en el servidor — usar userId local como fallback
                    const fallbackId =
                      localStorage.getItem("wedding_user_id") ?? crypto.randomUUID();
                    localStorage.setItem("wedding_user_id", fallbackId);
                    setCurrentUserId(fallbackId);
                    const save = await loadFromCloud(fallbackId);
                    if (save) {
                      cloudSave.current = save as GameState;
                      transitionTo("choose");
                      return;
                    }
                    transitionTo("oak-intro");
                  }
                } catch {
                  transitionTo("require-passkey");
                }
              },
            },
            {
              label: "Jugar sin guardar",
              action: async () => {
                setPhase("registering");
                localStorage.removeItem("wedding_credential_id");
                const existingId = localStorage.getItem("wedding_user_id");
                const localId = existingId ?? crypto.randomUUID();
                localStorage.setItem("wedding_user_id", localId);
                setCurrentUserId(localId);
                // Intentar recuperar save existente aunque no haya passkey
                const save = await loadFromCloud(localId);
                if (save) {
                  cloudSave.current = save as GameState;
                  transitionTo("choose");
                } else {
                  transitionTo("oak-intro");
                }
              },
            },
          ]}
        />
      </StyledLoadScreen>
    );
  }

  // ---- Continuar / Nueva partida ----
  if (phase === "choose") {
    const handleContinue = () => {
      if (choosingRef.current) return; // Evitar doble ejecución por closure stale
      choosingRef.current = true;
      setMenuReady(false);
      setPhase("registering"); // Mostrar spinner inmediatamente, desactiva el menú
      if (cloudSave.current) {
        const name = cloudSave.current.name ?? "Blue";
        localStorage.setItem(name, JSON.stringify(cloudSave.current));
        dispatch(loadFromState(cloudSave.current));
      }
      loadComplete();
    };

    const handleNewGame = () => {
      if (choosingRef.current) return; // Evitar doble ejecución por closure stale
      choosingRef.current = true;
      setMenuReady(false);
      setPhase("oak-intro");
    };

    const handleLinkDevice = async () => {
      if (choosingRef.current) return;
      choosingRef.current = true;
      const target = impersonationRef.current?.userId;
      if (!target) return;
      setMenuReady(false);
      setPhase("registering");
      try {
        const linkedId = await webauthnRegister(target);
        if (linkedId) {
          // Dispositivo enlazado: ya no necesitamos impersonar para futuras visitas
          setCurrentUserId(linkedId);
          setLinkedMsg("¡Dispositivo vinculado! Pulsa A para continuar.");
        } else {
          setLinkedMsg("No se pudo vincular. Pulsa A para seguir jugando.");
        }
      } catch {
        setLinkedMsg("Error al vincular. Pulsa A para seguir jugando.");
      }
      // Tras un breve delay, volver a "choose" sin opción de vincular
      // (mostraremos solo Continuar / Nueva). Forzamos releer el menú reseteando
      // el flag de impersonación visual.
      impersonationRef.current = impersonationRef.current
        ? { ...impersonationRef.current, mode: "play_as" }
        : null;
      choosingRef.current = false;
      setTimeout(() => {
        transitionTo("choose");
      }, 1500);
    };

    const isRecoverMode =
      impersonationRef.current?.mode === "recover" && !linkedMsg;

    const baseItems = [
      { label: "Continuar", action: handleContinue },
      { label: "Nueva partida", action: handleNewGame },
    ];
    const menuItems = isRecoverMode
      ? [...baseItems, { label: "Vincular Face ID/Huella", action: handleLinkDevice }]
      : baseItems;

    return (
      <StyledLoadScreen>
        {linkedMsg && (
          <TextArea>
            <Frame>
              <StatusText $flashing={false}>{linkedMsg}</StatusText>
            </Frame>
          </TextArea>
        )}
        <Menu
          show={menuReady}
          disabled={!menuReady}
          noExit
          top="2px"
          left="2px"
          padding="7vw"
          close={() => {}}
          menuItems={menuItems}
        />
      </StyledLoadScreen>
    );
  }

  return null;
};

export default LoadScreen;
