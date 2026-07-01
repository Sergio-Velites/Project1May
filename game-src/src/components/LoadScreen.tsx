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
  saveToCloud,
  createUser,
  setCurrentUserId,
  setImpersonatedUserId,
  setRecoverToken,
  findLocalGameState,
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

// Cuánto progreso tiene un save (suma de listas persistentes). Devuelve -1 para null.
const progressScore = (gs: unknown): number => {
  if (!gs || typeof gs !== "object") return -1;
  const s = gs as Record<string, unknown>;
  const len = (a: unknown): number => (Array.isArray(a) ? a.length : 0);
  return (
    len(s.defeatedTrainers) +
    len(s.completedQuests) +
    len(s.caughtPokemon) +
    len(s.collectedItems) +
    len(s.pokemon)
  );
};

// Devuelve el save con más progreso (cloud vs local). Si local es mejor y
// pushCloud es true, lo sube a la nube en background para reparar la nube obsoleta.
const loadBestSave = (
  userId: string,
  cloud: unknown,
  pushCloud: boolean
): GameState | null => {
  const local = findLocalGameState();
  if (progressScore(local) > progressScore(cloud)) {
    if (pushCloud && local !== null) saveToCloud(userId, local);
    return local as GameState;
  }
  return (cloud ?? local) as GameState | null;
};

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
      const rt = search.get("rt"); // token firmado de recuperación (link del admin)
      const target = (recover || playAs)?.trim();
      const mode: "play_as" | "recover" | null = recover
        ? "recover"
        : playAs
        ? "play_as"
        : null;
      // UUID v4 simple validation. Impersonación admitida también en
      // producción: el admin está protegido por cookie ADMIN_PASSWORD,
      // así que solo el administrador puede generar estas URLs.
      if (
        target &&
        mode &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          target
        )
      ) {
        impersonationRef.current = { userId: target, mode };
        setImpersonatedUserId(target, mode);
        // Token de recuperación (si viene en el link) para poder vincular una
        // passkey a una cuenta que ya tiene credenciales.
        if (mode === "recover" && rt) setRecoverToken(rt.trim());
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
        const cloudSave1 = await loadFromCloud(authedId);
        const best1 = loadBestSave(authedId, cloudSave1, true);
        if (best1) {
          cloudSave.current = best1;
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
        const cloudSave2 = await loadFromCloud(userId);
        const best2 = loadBestSave(userId, cloudSave2, true);
        if (best2) {
          cloudSave.current = best2;
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
                  // Recuperación discoverable (usernameless): si no había
                  // credencial local (p.ej. Safari borró localStorage por ITP),
                  // intentar autenticar con CUALQUIER passkey de este RP antes de
                  // registrar una nueva. Evita crear una cuenta — y por tanto una
                  // partida — duplicada para la misma persona.
                  if (!userId) {
                    userId = await webauthnAuth(null);
                  }
                  if (!userId) {
                    userId = await webauthnRegister();
                  }
                  if (userId) {
                    setCurrentUserId(userId);
                    const cloudSave3 = await loadFromCloud(userId);
                    const best3 = loadBestSave(userId, cloudSave3, true);
                    if (best3) {
                      cloudSave.current = best3;
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
                    const cloudSave4 = await loadFromCloud(fallbackId);
                    const best4 = loadBestSave(fallbackId, cloudSave4, true);
                    if (best4) {
                      cloudSave.current = best4;
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
                const cloudSave5 = await loadFromCloud(localId);
                const best5 = loadBestSave(localId, cloudSave5, false);
                if (best5) {
                  cloudSave.current = best5;
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
      const isRecover = impersonationRef.current?.mode === "recover";
      setMenuReady(false);
      setPhase("registering");
      let linkedOk = false;
      try {
        const linkedId = await webauthnRegister(target);
        if (linkedId) {
          setCurrentUserId(linkedId);
          linkedOk = true;
          setLinkedMsg(
            isRecover
              ? "¡Dispositivo vinculado! Cargando tu partida..."
              : "¡Dispositivo vinculado! Pulsa A para continuar."
          );
        } else {
          setLinkedMsg("No se pudo vincular. Pulsa A para seguir jugando.");
        }
      } catch {
        setLinkedMsg("Error al vincular. Pulsa A para seguir jugando.");
      }
      // En modo recover con éxito: redirigir a URL limpia para que el juego
      // arranque normalmente con la passkey recién vinculada.
      if (isRecover && linkedOk) {
        setTimeout(() => {
          window.location.href = window.location.origin + "/";
        }, 2000);
        return;
      }
      // En cualquier otro caso: volver al menú choose
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
      ? [{ label: "Vincular Face ID/Huella", action: handleLinkDevice }]
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
