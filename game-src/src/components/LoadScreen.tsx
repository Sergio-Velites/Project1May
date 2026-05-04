import styled, { keyframes } from "styled-components";
import Menu from "./Menu";
import Frame from "./Frame";
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadFromState, setName } from "../state/gameSlice";
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
} from "../app/cloud-save";
import OakIntro from "./OakIntro";
import NameKeyboard from "./NameKeyboard";
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

type Phase = "checking" | "require-passkey" | "registering" | "choose" | "name-picker" | "oak-intro" | "done";

const LoadScreen = () => {
  const dispatch = useDispatch();
  const titleOpen = useSelector(selectTitleMenu);
  const show = useSelector(selectLoadMenu);
  const gameboyOpen = useSelector(selectGameboyMenu);

  const [phase, setPhase] = useState<Phase>("checking");
  const [loaded, setLoaded] = useState(false);
  const [confirmedName, setConfirmedName] = useState<string | null>(null);
  const cloudSave = useRef<GameState | null>(null);

  const loadComplete = () => {
    setLoaded(true);
    setTimeout(() => {
      dispatch(hideLoadMenu());
    }, 300);
  };

  // Bootstrap cloud-save on first show
  useEffect(() => {
    if (!show) return;

    (async () => {
      const userId = localStorage.getItem("wedding_user_id");
      const credentialId = localStorage.getItem("wedding_credential_id");
      const webAuthnOk = isWebAuthnAvailable();

      if (userId && credentialId && webAuthnOk) {
        // Known user + registered passkey → authenticate
        const authedId = await webauthnAuth(credentialId);
        if (authedId) {
          setCurrentUserId(authedId);
          const save = await loadFromCloud(authedId);
          if (save) {
            cloudSave.current = save as GameState;
            setPhase("choose");
            return;
          }
          // Registered but no cloud save yet — new game
          setPhase("oak-intro");
          return;
        }
        // Auth failed — ask to re-register
        setPhase("require-passkey");
        return;
      }

      if (userId && !credentialId && webAuthnOk) {
        // Has userId but no passkey yet — require registration
        setPhase("require-passkey");
        return;
      }

      if (userId && !webAuthnOk) {
        // No WebAuthn available — load existing save if any
        setCurrentUserId(userId);
        const save = await loadFromCloud(userId);
        if (save) {
          cloudSave.current = save as GameState;
          setPhase("choose");
          return;
        }
        setPhase("oak-intro");
        return;
      }

      if (webAuthnOk) {
        // Brand new user with WebAuthn — require passkey before anything
        setPhase("require-passkey");
        return;
      }

      // Fallback: no WebAuthn, new user — create anonymous id
      const newId = await createUser();
      if (newId) setCurrentUserId(newId);
      setPhase("oak-intro");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  if (!show) return null;

  // ---- Teclado para elegir nombre ----
  if (phase === "name-picker") {
    return (
      <StyledLoadScreen>
        <NameKeyboard
          onConfirm={(name) => {
            dispatch(setName(name));
            setConfirmedName(name);
            setPhase("oak-intro");
          }}
        />
      </StyledLoadScreen>
    );
  }

  // ---- Intro del Prof. Oak (con nombre ya confirmado o en espera) ----
  if (phase === "oak-intro") {
    return (
      <StyledLoadScreen>
        <OakIntro
          onNameRequired={() => setPhase("name-picker")}
          confirmedName={confirmedName}
          onComplete={loadComplete}
        />
      </StyledLoadScreen>
    );
  }

  const handleContinue = () => {
    if (cloudSave.current) {
      const name = cloudSave.current.name ?? "Blue";
      localStorage.setItem(name, JSON.stringify(cloudSave.current));
      dispatch(loadFromState(cloudSave.current));
    }
    loadComplete();
  };

  const handleNewGame = () => {
    setConfirmedName(null);
    setPhase("oak-intro");
  };

  return (
    <StyledLoadScreen>
      {/* Checking / done: pulsing WEDDINGBOY text */}
      {(phase === "checking" || phase === "registering" || phase === "done") && (
        <TextArea>
          <Frame>
            <StatusText $flashing>WEDDINGBOY...</StatusText>
          </Frame>
        </TextArea>
      )}

      {/* Require passkey: mandatory for wedding confirmation */}
      {phase === "require-passkey" && (
        <>
          <TextArea>
            <Frame>
              <StatusText $flashing={false}>
                Activa guardado para confirmar asistencia.
              </StatusText>
            </Frame>
          </TextArea>
          <Menu
            disabled={titleOpen || gameboyOpen}
            show={!loaded}
            noExit
            top="2px"
            left="2px"
            padding="7vw"
            close={() => {}}
            menuItems={[
              {
                label: "Activar guardado",
                action: async () => {
                  setPhase("registering");
                  try {
                    const userId = await webauthnRegister();
                    if (userId) {
                      setCurrentUserId(userId);
                      const save = await loadFromCloud(userId);
                      if (save) {
                        cloudSave.current = save as GameState;
                        setPhase("choose");
                        return;
                      }
                      setPhase("oak-intro");
                    } else {
                      setPhase("require-passkey");
                    }
                  } catch {
                    setPhase("require-passkey");
                  }
                },
              },
              {
                label: "Jugar sin guardar",
                action: () => {
                  // Limpiar credencial para evitar futuros bucles de auth
                  localStorage.removeItem("wedding_credential_id");
                  // Reutilizar userId existente o crear uno nuevo local
                  const existingId = localStorage.getItem("wedding_user_id");
                  const localId = existingId ?? crypto.randomUUID();
                  localStorage.setItem("wedding_user_id", localId);
                  setCurrentUserId(localId);
                  setPhase("oak-intro");
                },
              },
            ]}
          />
        </>
      )}

      {/* Choose: continue or new game */}
      {phase === "choose" && (
        <>
          <TextArea>
            <Frame>
              <StatusText $flashing={!loaded}>
                ¡Bienvenido de nuevo!
              </StatusText>
            </Frame>
          </TextArea>
          <Menu
            disabled={titleOpen || gameboyOpen}
            show={!loaded}
            noExit
            top="2px"
            left="2px"
            padding="7vw"
            close={() => setLoaded(true)}
            menuItems={[
              { label: "Continuar", action: handleContinue },
              { label: "Nueva partida", action: handleNewGame },
            ]}
          />
        </>
      )}
    </StyledLoadScreen>
  );
};

export default LoadScreen;
