import { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import PixelImage from "../styles/PixelImage";
import oakPortrait from "../assets/portraits/oak.png";
import playerPortrait from "../assets/portraits/ash.png";
import ashDownSprite from "../assets/walk-sprites/ash-down.png";
import usePokemon from "../app/use-pokemon-metadata";

// ── Dialogue data ────────────────────────────────────────────────────────────

interface DialogueLine {
  sprite: "oak" | "pokemon" | "player" | "silhouette";
  text: string;
  pauseAfter?: "name-picker" | "start-game";
}

const BASE_DIALOGUE: DialogueLine[] = [
  { sprite: "oak",     text: "¡Hola!" },
  { sprite: "oak",     text: "¡Bienvenido al mundo\nde los POKÉMON!" },
  { sprite: "oak",     text: "¡Me llamo OAK!\n¡Todo el mundo me conoce\ncomo el PROF. POKÉMON!" },
  { sprite: "pokemon", text: "¡Este mundo está habitado\npor criaturas llamadas\nPOKÉMON!" },
  { sprite: "pokemon", text: "Para algunos, los POKÉMON\nson mascotas. Otros los\nusan para pelear." },
  { sprite: "player",  text: "Yo mismo los estudio\ncomo profesión." },
  { sprite: "player",  text: "¿Y tú?\n¿Cómo te llamas?", pauseAfter: "name-picker" },
];

const POST_NAME_DIALOGUE = (name: string): DialogueLine[] => [
  { sprite: "player",     text: `¡Correcto!\n¡Tu nombre es ${name}!` },
  { sprite: "player",     text: "¡Tu propia leyenda POKÉMON\nestá a punto de comenzar!" },
  { sprite: "player",     text: "¡Te espera un mundo de\nsueños y aventuras\ncon POKÉMON! ¡Vamos!", pauseAfter: "start-game" },
];

// ── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  0%   { opacity: 0; }
  50%  { opacity: 0.5; }
  100% { opacity: 1; }
`;

const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

const shrink = keyframes`
  0%   { transform: scale(1);    opacity: 1; }
  70%  { transform: scale(0.08); opacity: 1; }
  100% { transform: scale(0.08); opacity: 0; }
`;

const appear = keyframes`
  0%   { opacity: 0; }
  100% { opacity: 1; }
`;

const popIn = keyframes`
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
`;

// ── Styled components ────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2000;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`;

const SpriteArea = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

interface OakImageProps {
  $silhouette?: boolean;
  $shrink?: boolean;
}

const OakImage = styled(PixelImage)<OakImageProps>`
  height: 55%;
  max-height: 200px;
  animation: ${appear} 0.1s ease-in-out forwards;
  filter: ${(p) => p.$silhouette ? "brightness(0)" : "none"};
  ${(p) =>
    p.$shrink &&
    css`
      animation: ${shrink} 2.5s ease-in-out forwards;
    `}

  @media (max-width: 1000px) {
    height: 40%;
    max-height: 120px;
  }
`;

const PokemonImage = styled(PixelImage)`
  height: 35%;
  max-height: 160px;
  animation: ${appear} 0.1s ease-in-out forwards;

  @media (max-width: 1000px) {
    height: 28%;
    max-height: 100px;
  }
`;

const MapSprite = styled(PixelImage)`
  width: 16px;
  height: 16px;
  animation: ${popIn} 0.3s ease-out forwards;

  @media (min-width: 1000px) {
    width: 32px;
    height: 32px;
  }
`;

// Panel "▶ NEW NAME" que aparece cuando hay que elegir nombre
const NamePromptPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4em;
  border: 3px solid black;
  padding: 6% 10%;
  background: var(--bg);

  @media (max-width: 1000px) {
    border-width: 2px;
    padding: 5% 8%;
  }
`;

const NamePromptLabel = styled.h2`
  font-family: "PokemonGB";
  font-size: 16px;
  color: #181010;
  margin-bottom: 8px;
  text-align: center;

  @media (max-width: 1000px) {
    font-size: 7px;
    margin-bottom: 4px;
  }
`;

const NamePromptOption = styled.h2`
  font-family: "PokemonGB";
  font-size: 20px;
  color: #181010;
  display: flex;
  align-items: center;
  gap: 0.3em;

  @media (max-width: 1000px) {
    font-size: 8px;
  }
`;

const TextBox = styled.div`
  position: relative;
  width: 100%;
  height: 22%;
  background: var(--bg);
  border-top: 3px solid black;
  padding: 8px 18px;
  display: flex;
  align-items: center;

  @media (max-width: 1000px) {
    height: 30%;
    padding: 5px 10px;
    border-top: 2px solid black;
  }
`;

const DialogueText = styled.h1`
  color: black;
  font-size: 22px;
  font-family: "PokemonGB";
  line-height: 1.6;
  white-space: pre-wrap;

  @media (max-width: 1000px) {
    font-size: 8px;
    line-height: 1.5;
  }
`;

interface ArrowProps {
  $visible: boolean;
}

const Arrow = styled.span<ArrowProps>`
  position: absolute;
  bottom: 12px;
  right: 16px;
  width: 3px;
  height: 3px;
  font-size: 3px;
  color: #181010;
  box-shadow:
    1em 0em 0 #181010, 2em 0em 0 #181010,
    1em 1em 0 #181010, 2em 1em 0 #181010, 3em 1em 0 #181010,
    1em 2em 0 #181010, 2em 2em 0 #181010, 3em 2em 0 #181010, 4em 2em 0 #181010,
    1em 3em 0 #181010, 2em 3em 0 #181010, 3em 3em 0 #181010, 4em 3em 0 #181010, 5em 3em 0 #181010,
    1em 4em 0 #181010, 2em 4em 0 #181010, 3em 4em 0 #181010, 4em 4em 0 #181010,
    1em 5em 0 #181010, 2em 5em 0 #181010, 3em 5em 0 #181010,
    1em 6em 0 #181010, 2em 6em 0 #181010;
  transform: rotate(90deg);
  animation: ${blink} 1s infinite;
  opacity: ${(p) => (p.$visible ? 1 : 0)};

  @media (max-width: 1000px) {
    bottom: 6px;
    right: 8px;
  }
`;

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  onNameRequired: () => void;
  confirmedName: string | null;
  onComplete: () => void;
}

const TYPEWRITER_MS = 40;

const OakIntro = ({ onNameRequired, confirmedName, onComplete }: Props) => {
  // Random Pokémon for the "pokemon" sprite slot
  const [pokemonId] = useState(() => Math.floor(Math.random() * 151) + 1);
  const pokemon = usePokemon(pokemonId);

  // dialogue lines (extended when confirmedName arrives)
  const linesRef = useRef<DialogueLine[]>(BASE_DIALOGUE);
  const [lineIndex, setLineIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");  // typewriter buffer
  const [finished, setFinished] = useState(false); // all chars shown
  const [waitingForName, setWaitingForName] = useState(false); // showing name panel
  const [shrinkPhase, setShrinkPhase] = useState<"idle" | "shrinking" | "overworld">("idle");

  const currentLine = linesRef.current[lineIndex];
  const fullText = currentLine?.text ?? "";

  // ── Typewriter effect ────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentLine || finished) return;
    if (displayed.length >= fullText.length) {
      setFinished(true);
      return;
    }
    const t = setTimeout(() => {
      setDisplayed(fullText.slice(0, displayed.length + 1));
    }, TYPEWRITER_MS);
    return () => clearTimeout(t);
  }, [displayed, fullText, finished, currentLine]);

  // ── When confirmedName arrives, inject post-name lines ───────────────────
  useEffect(() => {
    if (!confirmedName) return;
    const alreadyInjected = linesRef.current.some((l) =>
      l.text.includes(confirmedName)
    );
    if (alreadyInjected) return;
    linesRef.current = [...BASE_DIALOGUE, ...POST_NAME_DIALOGUE(confirmedName)];
    setLineIndex(BASE_DIALOGUE.length);
    setDisplayed("");
    setFinished(false);
    setWaitingForName(false);
  }, [confirmedName]);

  // ── Advance handler (A button) ───────────────────────────────────────────
  const advance = useCallback(() => {
    // If waiting for name selection, do nothing (handled by name panel click)
    if (waitingForName) return;

    if (!finished) {
      // Skip typewriter: show all text at once
      setDisplayed(fullText);
      setFinished(true);
      return;
    }

    const pause = currentLine?.pauseAfter;

    if (pause === "name-picker") {
      setWaitingForName(true);
      return;
    }

    if (pause === "start-game") {
      setShrinkPhase("shrinking");
      setTimeout(() => setShrinkPhase("overworld"), 900);
      setTimeout(() => onComplete(), 1700);
      return;
    }

    // Advance to next line
    const next = lineIndex + 1;
    if (next < linesRef.current.length) {
      setLineIndex(next);
      setDisplayed("");
      setFinished(false);
    }
  }, [finished, fullText, currentLine, waitingForName, lineIndex, onComplete]);

  useEvent(Event.A, advance);

  if (!currentLine) return null;

  const sprite = currentLine.sprite;

  return (
    <Overlay onClick={advance}>
      <SpriteArea>
        {sprite === "oak" && (
          <OakImage key="oak" src={oakPortrait} alt="Prof. Oak" />
        )}
        {sprite === "pokemon" && pokemon && (
          <PokemonImage key="pokemon" src={pokemon.images.front} alt="POKÉMON" />
        )}
        {sprite === "player" && shrinkPhase === "idle" && (
          <OakImage key="player-idle" src={playerPortrait} alt="Player" />
        )}
        {sprite === "player" && shrinkPhase === "shrinking" && (
          <OakImage key="player-shrink" src={playerPortrait} alt="Player" $shrink />
        )}
        {sprite === "player" && shrinkPhase === "overworld" && (
          <MapSprite key="map-sprite" src={ashDownSprite} alt="Player" />
        )}
        {sprite === "silhouette" && (
          <OakImage
            key="silhouette"
            src={playerPortrait}
            alt="Player"
            $silhouette
          />
        )}

        {/* Name choice panel */}
        {waitingForName && (
          <NamePromptPanel>
            <NamePromptLabel>NAME</NamePromptLabel>
            <NamePromptOption
              onClick={(e) => {
                e.stopPropagation();
                setWaitingForName(false);
                onNameRequired();
              }}
            >
              ▶ NUEVO NOMBRE
            </NamePromptOption>
          </NamePromptPanel>
        )}
      </SpriteArea>

      <TextBox>
        <DialogueText>{displayed}</DialogueText>
        <Arrow $visible={finished && !waitingForName} />
      </TextBox>
    </Overlay>
  );
};

export default OakIntro;
