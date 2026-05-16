import { useCallback, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import useEvent from "../app/use-event";
import emitter, { Event } from "../app/emitter";
import { useDispatch, useSelector } from "react-redux";
import { healPokemon, selectMap, selectPos, selectPokemon } from "../state/gameSlice";
import {
  hidePokemonCenterMenu,
  selectPokemonCenterMenu,
  selectStartMenu,
  showPokemonCenterMenu,
} from "../state/uiSlice";
import Frame from "./Frame";
import Menu from "./Menu";
import useIsMobile from "../app/use-is-mobile";
import ballImg from "../assets/pokemon/simple/ball-0.png";

// ── Sonido "ding" via Web Audio API — imita el bip de colocación del original ──
function playPokeballDing(audioCtx: AudioContext, delayMs: number) {
  const startAt = audioCtx.currentTime + delayMs / 1000;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(880, startAt);
  gain.gain.setValueAtTime(0.15, startAt);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.08);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + 0.09);
}

// ── Styled ────────────────────────────────────────────────────────────────────
const StyledPokemonCenter = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

const TextContainer = styled.div`
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

// ── Rejilla de pokéballs sobre la bandeja de la máquina de curación ──────────
// La máquina de curación ocupa las tiles (1-2, 2) del mapa.
// La nurse está en pokemonCenter = {x:3, y:2}. El jugador siempre en (3,3).
//
// Fórmula (PokemonCenter está fuera de StyledGame, relativo al Container):
//   left = 50% - (0.5 + Δx) * TILE    donde TILE = 16cqw/2.34
//   top  = 50% - (0.5 + Δy) * TILE
//
// Máquina tile (1, 2):  Δx = 3-1 = 2,  Δy = 3-2 = 1
//   left = 50% - 2.5 * TILE = 50% - 40cqw/2.34
//   top  = 50% - 1.5 * TILE = 50% - 24cqw/2.34
//
// Rejilla: 2 tiles ancho × 1.5 tiles alto = 3 filas × 2 cols
// ── Rejilla de pokéballs sobre la bandeja de la máquina de curación ──────────
// Geometría: el jugador está en (3,3), la nurse en (3,2), la máquina (cuadrado
// negro) ocupa el tile (2,2) — 1 tile completo.
//
// La proyección de un tile (X,Y) al container (PokemonCenter renderiza fuera
// de StyledGame, posicionado absolute sobre todo el viewport) es:
//   screenX = 50% + (X - playerX - 0.5) * TILE
//   screenY = 50% + (Y - playerY - 0.5) * TILE
// donde TILE = 16cqw / 2.34
//
// Para tile (2,2) con jugador en (3,3):
//   left = 50% - 1.5 * TILE = 50% - 24cqw/2.34
//   top  = 50% - 1.5 * TILE = 50% - 24cqw/2.34
//   width  = height = 1 * TILE = 16cqw/2.34
//
// Dentro: rejilla 2 columnas × 3 filas → 6 huecos para los 6 pokémon
const MachineGrid = styled.div`
  position: absolute;
  left: calc(50% - 24cqw / 2.34);
  top:  calc(50% - 40cqw / 2.34);
  width:  calc(16cqw / 2.34);
  height: calc(16cqw / 2.34);
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr 1fr;
  z-index: 200;
  pointer-events: none;
`;

const popIn = keyframes`
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.25); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const BallCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const BallImg = styled.img`
  width: 80%;
  height: 80%;
  image-rendering: pixelated;
  object-fit: contain;
  animation: ${popIn} 0.15s ease-out forwards;
`;

// ── Timing ────────────────────────────────────────────────────────────────────
const BALL_INTERVAL_MS = 400;  // pausa entre cada pokéball
const HEAL_JINGLE_DELAY_MS = 400; // espera tras la última pokéball antes del jingle
const HEAL_JINGLE_DURATION_MS = 3200; // duración del jingle pokemon-recovery.mp3

const PokemonCenter = () => {
  const dispatch = useDispatch();

  const pos = useSelector(selectPos);
  const map = useSelector(selectMap);
  const show = useSelector(selectPokemonCenterMenu);
  const startMenuOpen = useSelector(selectStartMenu);
  const party = useSelector(selectPokemon);
  const isMobile = useIsMobile();

  const [stage, setStage] = useState<number>(0);
  // cuántas pokéballs se muestran ya en la animación
  const [visibleBalls, setVisibleBalls] = useState<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const exit = useCallback(() => {
    dispatch(hidePokemonCenterMenu());
    setStage(0);
    setVisibleBalls(0);
  }, [dispatch]);

  // ── Animación pokéballs + curación ───────────────────────────────────────
  const startHealSequence = useCallback(() => {
    setStage(3);
    setVisibleBalls(0);

    const count = Math.max(party.length, 1);

    // Crear (o reutilizar) AudioContext para los dings
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;

    // Programar aparición de cada pokéball y su sonido
    for (let i = 0; i < count; i++) {
      const delay = i * BALL_INTERVAL_MS;
      setTimeout(() => setVisibleBalls(i + 1), delay);
      playPokeballDing(ctx, delay);
    }

    // Tras la última pokéball: lanzar jingle de curación
    const jingleStart = count * BALL_INTERVAL_MS + HEAL_JINGLE_DELAY_MS;
    setTimeout(() => {
      emitter.emit(Event.HealPokemon);
    }, jingleStart);

    // Al finalizar el jingle: aplicar curación y avanzar stage
    setTimeout(() => {
      dispatch(healPokemon());
      setVisibleBalls(0);
      setStage(4);
    }, jingleStart + HEAL_JINGLE_DURATION_MS);
  }, [dispatch, party.length]);

  useEvent(Event.A, () => {
    if (startMenuOpen) return;

    if (!show) {
      if (
        map.pokemonCenter &&
        pos.y - 1 === map.pokemonCenter.y &&
        pos.x === map.pokemonCenter.x
      ) {
        dispatch(showPokemonCenterMenu());
      }
    } else {
      if (stage === 0) setStage(1);
      else if (stage === 1) setStage(2);
      else if (stage === 2) return;
      else if (stage === 3) return; // bloquear A durante animación
      else if (stage === 4) setStage(5);
      else if (stage === 5) exit();
    }
  });

  if (!show) return null;

  const text = () => {
    if (stage === 0) return "¡Bienvenido al CENTRO POKéMON!";
    if ([1, 2].includes(stage))
      return "¡Curamos a tus POKéMON para que estén perfectos!";
    if (stage === 3) return "De acuerdo. Vamos a necesitar tus POKéMON.";
    if (stage === 4) return "¡Gracias! ¡Tus POKéMON están listos para luchar!";
    if (stage === 5) return "¡Esperamos verte de nuevo!";
  };

  return (
    <StyledPokemonCenter>
      {/* Rejilla 3×2 de pokéballs sobre la bandeja de la máquina */}
      {stage === 3 && visibleBalls > 0 && (
        <MachineGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <BallCell key={i}>
              {i < visibleBalls && <BallImg src={ballImg} alt="" />}
            </BallCell>
          ))}
        </MachineGrid>
      )}

      <TextContainer>
        <Frame wide tall flashing={[0, 1, 4, 5].includes(stage)}>
          {text()}
        </Frame>
      </TextContainer>
      <Menu
        show={stage === 2}
        disabled={startMenuOpen}
        right="0"
        bottom={isMobile ? "30%" : "20%"}
        noExit
        close={() => exit()}
        menuItems={[
          {
            label: "CURAR",
            action: startHealSequence,
          },
          {
            label: "CANCELAR",
            action: () => exit(),
          },
        ]}
      />
    </StyledPokemonCenter>
  );
};

export default PokemonCenter;
