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

type Phase = "checking" | "choose" | "prompt" | "name-picker" | "oak-intro" | "done";

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
        }
        setPhase("oak-intro");
        return;
      }

      if (userId && !credentialId) {
        // Known user but no passkey
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
        // New device with WebAuthn support → ask to register
        setPhase("prompt");
        return;
      }

      // Fallback: create anonymous user, no passkey — go straight to new game
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
    setPhase("oak-intro");
  };

  return (
    <StyledLoadScreen>
      {/* Checking / done: pulsing WEDDINGBOY text */}
      {(phase === "checking" || phase === "done") && (
        <TextArea>
          <Frame>
            <StatusText $flashing>WEDDINGBOY...</StatusText>
          </Frame>
        </TextArea>
      )}

      {/* Choose: continue or new game */}
      {phase === "choose" && (
        <>
          <TextArea>
            <Frame>
              <StatusText $flashing={!loaded}>
                ¿Continuar la partida guardada?
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

      {/* Prompt: ask to register passkey */}
      {phase === "prompt" && (
        <>
          <TextArea>
            <Frame>
              <StatusText $flashing={!loaded}>
                ¿Guardar con Face ID / huella?
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
              {
                label: "Sí, guardar",
                action: async () => {
                  setPhase("checking");
                  const userId = await webauthnRegister();
                  if (userId) {
                    setCurrentUserId(userId);
                    const save = await loadFromCloud(userId);
                    if (save) {
                      cloudSave.current = save as GameState;
                      setPhase("choose");
                      return;
                    }
                  }
                  handleNewGame();
                },
              },
              {
                label: "Sin guardar",
                action: async () => {
                  setPhase("checking");
                  const userId = await createUser();
                  if (userId) setCurrentUserId(userId);
                  handleNewGame();
                },
              },
            ]}
          />
        </>
      )}
    </StyledLoadScreen>
  );
};

export default LoadScreen;
