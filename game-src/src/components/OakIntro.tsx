/**
 * OakIntro — RSVP boda estilo Game Boy.
 * Autónomo: gestiona nombre, acompañante, niños, alergias, bus y preboda.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import PixelImage from "../styles/PixelImage";
import { useDispatch } from "react-redux";
import { setName, setRsvp } from "../state/gameSlice";
import { RSVPData } from "../state/state-types";
import { saveRsvp, getCurrentUserId } from "../app/cloud-save";
import usePokemon from "../app/use-pokemon-metadata";
import oakPortrait from "../assets/portraits/oak.png";
import ashPortrait from "../assets/portraits/ash.png";
import sergioPortrait from "../assets/portraits/sergio.png";
import martaPortrait from "../assets/portraits/marta.png";
import youngsterPortrait from "../assets/portraits/youngster.png";
import bikerPortrait from "../assets/portraits/biker.png";
import hikerPortrait from "../assets/portraits/hiker.png";
import ashDownSprite from "../assets/walk-sprites/ash-down.png";

type SpriteId =
  | "oak" | "player" | "duo"
  | "youngster" | "biker" | "hiker"
  | "pokemon113" | "pokemon122" | "pokemon132";

type Stage =
  | "dialogue"
  | "name-picker"
  | "companion-choice"
  | "companion-picker"
  | "children-select"
  | "allergy-choice"
  | "allergy-input"
  | "bus-outbound"
  | "bus-return"
  | "preboda-choice"
  | "saving"
  | "done";

interface DialogueLine {
  sprite: SpriteId;
  text: string;
  next?: Stage;
}

// ── Static dialogue lines ─────────────────────────────────────────────────────

const INTRO_LINES: DialogueLine[] = [
  { sprite: "oak",        text: "¡Hola!" },
  { sprite: "oak",        text: "¡Bienvenido al mundo\nde los POKÉMON!" },
  { sprite: "oak",        text: "¡Me llamo OAK!\nAunque hoy..." },
  { sprite: "oak",        text: "...puedes llamarme\nMAESTRO DE CEREMONIAS." },
  { sprite: "oak",        text: "Este mundo está lleno de\namistades, aventuras..." },
  { sprite: "pokemon122", text: "¡Y grandes celebraciones!" },
  { sprite: "pokemon132", text: "Durante años, entrenadores\nde todas partes han viajado\njuntos, compartido combates..." },
  { sprite: "pokemon132", text: "...y encontrado compañeros\npara toda la vida." },
  { sprite: "oak",        text: "Precisamente por eso\nestamos hoy aquí." },
  { sprite: "oak",        text: "Porque dos entrenadores\nlegendarios..." },
  { sprite: "duo",        text: "¡MARTA y SERGIO..." },
  { sprite: "duo",        text: "...van a unir sus caminos\nel 8 de agosto de 2026!" },
  { sprite: "oak",        text: "Pero antes de comenzar\nesta gran aventura..." },
  { sprite: "oak",        text: "¡Necesitamos registrar\ntu ficha de\nENTRENADOR INVITADO!" },
  { sprite: "player",     text: "Primero de todo..." },
  { sprite: "player",     text: "¿Cómo te llamas?", next: "name-picker" },
];

// ── Dynamic line builders ─────────────────────────────────────────────────────

const buildPostNameLines = (name: string): DialogueLine[] => [
  { sprite: "player",  text: `¡Ah, claro!\n¡Tu nombre es ${name}!` },
  { sprite: "oak",     text: "Excelente.\nDime una cosa..." },
  { sprite: "oak",     text: "¿Viajarás acompañado\nen esta aventura?", next: "companion-choice" },
];

const buildChildrenIntro = (): DialogueLine[] => [
  { sprite: "youngster", text: "¿Cuántos niños vendrán\ncontigo?", next: "children-select" },
];

const buildAllergyIntro = (): DialogueLine[] => [
  { sprite: "pokemon113", text: "¿Tienes/Tenéis alguna intolerancia\no alergia alimentaria?", next: "allergy-choice" },
];

const buildBusLines = (): DialogueLine[] => [
  { sprite: "biker", text: "Para facilitar el viaje\nhasta VILLAMAYOR..." },
  { sprite: "biker", text: "Habrá un BUS especial\npara entrenadores invitados." },
  { sprite: "biker", text: "Las paradas serán:" },
  { sprite: "biker", text: "11:00 CLUB DE TENIS\n11:20 HOTEL TRES REYES" },
  { sprite: "biker", text: "¿Utilizarás el bus de ida?", next: "bus-outbound" },
];

const buildPrebodaLines = (): DialogueLine[] => [
  { sprite: "oak",   text: "Una última cosa." },
  { sprite: "oak",   text: "Antes del gran día..." },
  { sprite: "hiker", text: "Se celebrará una PREBODA\nel día 6 en EL BOSQUECILLO" },
  { sprite: "hiker", text: "(Junto al Hotel Tres Reyes\nde Pamplona)" },
  { sprite: "hiker", text: "¿Te unirás al encuentro\nde entrenadores?", next: "preboda-choice" },
];

const buildFinaleLines = (): DialogueLine[] => [
  { sprite: "oak",        text: "¡Fantástico!" },
  { sprite: "oak",        text: "Tu registro para la\nWEDDING VERSION ya\nestá completo." },
  { sprite: "oak",        text: "MARTA y SERGIO te esperan\npara una aventura\ninolvidable." },
  { sprite: "oak",        text: "Risas, baile, amigos,\nvino y combates en pista..." },
  { sprite: "pokemon132", text: "...y probablemente algún\nderretido después de las copas." },
  { sprite: "oak",        text: "Si cambias de opinión,\ncomienza una nueva partida\ny actualizarás tu registro." },
  { sprite: "oak",        text: "¡Prepárate!" },
  { sprite: "player",     text: "¡Tu aventura hacia la\ngran boda está a punto\nde comenzar!", next: "done" },
];

// ── Animations ────────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const blink = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
`;

const shrinkAnim = keyframes`
  0%   { transform: scale(1);    opacity: 1; }
  70%  { transform: scale(0.08); opacity: 1; }
  100% { transform: scale(0.08); opacity: 0; }
`;

const popIn = keyframes`
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.15); opacity: 1; }
  100% { transform: scale(1);   opacity: 1; }
`;

// ── Styled components ───────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: absolute; inset: 0; z-index: 2000;
  background: var(--bg); display: flex;
  flex-direction: column; justify-content: flex-end;
`;

const SpriteArea = styled.div`
  flex: 1; display: flex;
  align-items: center; justify-content: center;
  position: relative;
`;

interface ImgProps { $shrink?: boolean; }

const Portrait = styled(PixelImage)<ImgProps>`
  height: 55%; max-height: 200px;
  animation: ${fadeIn} 0.1s ease forwards;
  ${(p: ImgProps) => p.$shrink && css`animation: ${shrinkAnim} 2.5s ease forwards;`}
  @media (max-width: 1000px) { height: 40%; max-height: 120px; }
`;

const PokemonImg = styled(PixelImage)`
  height: 35%; max-height: 160px;
  animation: ${fadeIn} 0.1s ease forwards;
  @media (max-width: 1000px) { height: 28%; max-height: 100px; }
`;

const MapSprite = styled(PixelImage)`
  width: 16px; height: 16px;
  animation: ${popIn} 0.3s ease-out forwards;
  @media (min-width: 1000px) { width: 32px; height: 32px; }
`;

const DuoWrap = styled.div`
  display: flex; flex-direction: row;
  align-items: flex-end; gap: 12%;
  animation: ${fadeIn} 0.15s ease forwards;
`;

const DuoPortrait = styled(PixelImage)`
  height: 45%; max-height: 160px;
  @media (max-width: 1000px) { height: 33%; max-height: 100px; }
`;

const TextBox = styled.div`
  position: relative; width: 100%; height: 22%;
  background: var(--bg); border-top: 3px solid black;
  padding: 8px 18px; display: flex; align-items: center;
  @media (max-width: 1000px) { height: 30%; padding: 5px 10px; border-top: 2px solid black; }
`;

const DialogueText = styled.h1`
  color: black; font-size: 22px;
  font-family: "PokemonGB"; line-height: 1.6; white-space: pre-wrap;
  @media (max-width: 1000px) { font-size: 8px; line-height: 1.5; }
`;

interface ArrowProps { $visible: boolean; }
const Arrow = styled.span<ArrowProps>`
  position: absolute; bottom: 12px; right: 16px;
  width: 3px; height: 3px; font-size: 3px; color: #181010;
  box-shadow:
    1em 0em 0 #181010, 2em 0em 0 #181010,
    1em 1em 0 #181010, 2em 1em 0 #181010, 3em 1em 0 #181010,
    1em 2em 0 #181010, 2em 2em 0 #181010, 3em 2em 0 #181010, 4em 2em 0 #181010,
    1em 3em 0 #181010, 2em 3em 0 #181010, 3em 3em 0 #181010, 4em 3em 0 #181010, 5em 3em 0 #181010,
    1em 4em 0 #181010, 2em 4em 0 #181010, 3em 4em 0 #181010, 4em 4em 0 #181010,
    1em 5em 0 #181010, 2em 5em 0 #181010, 3em 5em 0 #181010,
    1em 6em 0 #181010, 2em 6em 0 #181010;
  transform: rotate(90deg); animation: ${blink} 1s infinite;
  opacity: ${(p: ArrowProps) => (p.$visible ? 1 : 0)};
  @media (max-width: 1000px) { bottom: 6px; right: 8px; }
`;

const ChoicePanel = styled.div`
  position: absolute; top: 20%; right: 4%;
  border: 3px solid black; background: var(--bg);
  padding: 4% 6%; display: flex; flex-direction: column;
  gap: 0.6em; z-index: 10;
  @media (max-width: 1000px) { border-width: 2px; padding: 3% 5%; gap: 0.4em; }
`;

interface CIProps { $selected: boolean; }
const ChoiceItem = styled.h2<CIProps>`
  font-family: "PokemonGB"; font-size: 18px; color: #181010;
  display: flex; align-items: center; gap: 0.4em;
  &::before { content: "${(p: CIProps) => p.$selected ? "▶" : " "}"; }
  @media (max-width: 1000px) { font-size: 8px; }
`;

const NumberBox = styled.div`
  display: flex; align-items: center; gap: 1em;
  border: 3px solid black; background: var(--bg);
  padding: 5% 8%; position: absolute; top: 20%; right: 4%; z-index: 10;
  @media (max-width: 1000px) { border-width: 2px; padding: 3% 5%; gap: 0.5em; }
`;

const NumberLabel = styled.h2`
  font-family: "PokemonGB"; font-size: 28px; color: #181010;
  min-width: 2ch; text-align: center;
  @media (max-width: 1000px) { font-size: 12px; }
`;

const ArrowLbl = styled.h2`
  font-family: "PokemonGB"; font-size: 20px; color: #181010;
  cursor: pointer; user-select: none;
  @media (max-width: 1000px) { font-size: 9px; }
`;

const AllergyWrap = styled.div`
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 6%; gap: 8px; background: var(--bg); z-index: 10;
`;

const AllergyLabel = styled.h2`
  font-family: "PokemonGB"; font-size: 16px; color: #181010; text-align: center;
  @media (max-width: 1000px) { font-size: 7px; }
`;

const AllergyTextarea = styled.textarea`
  width: 100%; flex: 1; max-height: 55%;
  background: var(--bg); border: 3px solid black; padding: 8px;
  font-family: "PokemonGB", monospace; font-size: 16px; color: #181010;
  resize: none; outline: none;
  /* font-size >= 16px prevents iOS auto-zoom on focus */
  @media (max-width: 1000px) { border-width: 2px; padding: 4px; }
`;

const ConfirmBtn = styled.button`
  font-family: "PokemonGB"; font-size: 14px;
  background: #181010; color: var(--bg);
  border: none; padding: 8px 18px; cursor: pointer;
  @media (max-width: 1000px) { font-size: 6px; padding: 5px 10px; }
`;

const SavingText = styled.h1`
  font-family: "PokemonGB"; font-size: 22px; color: #181010; padding: 8px 18px;
  @media (max-width: 1000px) { font-size: 8px; padding: 5px 10px; }
`;

// ── Native name input (teclado nativo móvil) ──────────────────────────────────────
const NativeInputWrap = styled.div`
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  background: var(--bg); padding: 8%; gap: 1.2em; z-index: 20;
`;

const NativeLabel = styled.h2`
  font-family: "PokemonGB"; font-size: 16px; color: #181010;
  text-align: center; line-height: 1.8; white-space: pre-wrap;
  @media (max-width: 1000px) { font-size: 9px; }
`;

const NativeField = styled.input`
  width: 100%; max-width: 280px;
  background: var(--bg); border: 3px solid black;
  padding: 10px 14px;
  font-family: "PokemonGB", monospace;
  font-size: 16px; /* ≥16px previene zoom iOS */
  color: #181010; outline: none; text-align: center; letter-spacing: 0.08em;
  @media (max-width: 1000px) { border-width: 2px; }
`;

const NativeOkBtn = styled.button`
  font-family: "PokemonGB"; font-size: 14px;
  background: #181010; color: var(--bg);
  border: none; padding: 10px 22px; cursor: pointer;
  @media (max-width: 1000px) { font-size: 8px; padding: 8px 16px; }
`;

interface NativeNameProps { prompt: string; onConfirm: (name: string) => void; }
const NativeNamePicker = ({ prompt, onConfirm }: NativeNameProps) => {
  const [val, setVal] = useState("");
  const submit = () => { const t = val.trim(); if (t) onConfirm(t); };
  return (
    <NativeInputWrap>
      <NativeLabel>{prompt}</NativeLabel>
      <NativeField
        autoFocus
        maxLength={10}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); }}
        placeholder="MAX 10"
      />
      <NativeOkBtn onClick={submit}>OK ▶</NativeOkBtn>
    </NativeInputWrap>
  );
};

// ── Component ────────────────────────────────────────────────────────────────────

interface Props { onComplete: () => void; }

const TYPEWRITER_MS = 40;

const OakIntro = ({ onComplete }: Props) => {
  const dispatch = useDispatch();
  const chansey = usePokemon(113);
  const mrMime  = usePokemon(122);
  const ditto   = usePokemon(132);

  const [displayed,   setDisplayed]  = useState("");
  const [finished,    setFinished]   = useState(false);
  const [stage,       setStage]      = useState<Stage>("dialogue");
  const [lines,       setLines]      = useState<DialogueLine[]>(INTRO_LINES);
  const [idx,         setIdx]        = useState(0);
  const [playerName,  setPlayerName] = useState("");
  const [companion,   setCompanion]  = useState<string | null>(null);
  const [children,    setChildren]   = useState(0);
  const [allergyTxt,  setAllergyTxt] = useState("");
  const [busOutbound, setBusOutbound]= useState(false);
  const [busReturn,   setBusReturn]  = useState<"none" | "23:00" | "1:45">("none");
  const [preboda,     setPreboda]    = useState(false);
  const [cursor,      setCursor]     = useState(0);
  const [shrink,      setShrink]     = useState<"idle" | "shrinking" | "overworld">("idle");

  const currentLine = lines[idx];
  const fullText = currentLine?.text ?? "";

  useEffect(() => {
    if (stage !== "dialogue" || !currentLine || finished) return;
    if (displayed.length >= fullText.length) { setFinished(true); return; }
    const t = setTimeout(() => setDisplayed(fullText.slice(0, displayed.length + 1)), TYPEWRITER_MS);
    return () => clearTimeout(t);
  }, [displayed, fullText, finished, currentLine, stage]);

  const enterLines = useCallback((newLines: DialogueLine[]) => {
    setLines(newLines); setIdx(0);
    setDisplayed(""); setFinished(false);
    setStage("dialogue"); setCursor(0);
  }, []);

  const advanceDialogue = useCallback(() => {
    if (!finished) { setDisplayed(fullText); setFinished(true); return; }
    if (currentLine?.next) { setStage(currentLine.next); setCursor(0); return; }
    const next = idx + 1;
    if (next < lines.length) { setIdx(next); setDisplayed(""); setFinished(false); }
  }, [finished, fullText, currentLine, idx, lines]);

  const doneRef = useRef(false);
  const triggerEnding = useCallback((
    pre: boolean, busOut: boolean,
    busRet: "none" | "23:00" | "1:45",
    comp: string | null,
    allergy: string,
  ) => {
    if (doneRef.current) return;
    doneRef.current = true;
    setShrink("shrinking");
    setStage("saving");
    const rsvpData: RSVPData = {
      playerName, companion: comp, children,
      allergies: allergy.trim() || null,
      busOutbound: busOut, busReturn: busRet, preboda: pre,
    };
    dispatch(setName(playerName));
    dispatch(setRsvp(rsvpData));
    saveRsvp(getCurrentUserId() ?? "", rsvpData).finally(() => {
      setTimeout(() => setShrink("overworld"), 900);
      setTimeout(() => onComplete(), 1700);
    });
  }, [playerName, children, dispatch, onComplete]);

  useEffect(() => {
    if (stage === "done") {
      triggerEnding(preboda, busOutbound, busReturn, companion, allergyTxt);
    }
  }, [stage]); // eslint-disable-line react-hooks/exhaustive-deps

  useEvent(Event.A, () => {
    if (stage === "dialogue") { advanceDialogue(); return; }
    if (stage === "companion-choice") {
      if (cursor === 0) {
        enterLines([{ sprite: "oak", text: "¡Magnífico!\n¿Y cómo se llama\ntu acompañante?", next: "companion-picker" }]);
      } else {
        setCompanion(null);
        enterLines(buildChildrenIntro());
      }
      return;
    }
    if (stage === "children-select") { enterLines(buildAllergyIntro()); return; }
    if (stage === "allergy-choice") {
      if (cursor === 0) setStage("allergy-input");
      else enterLines(buildBusLines());
      return;
    }
    if (stage === "bus-outbound") {
      if (cursor === 0) { setBusOutbound(true); setStage("bus-return"); setCursor(0); }
      else { setBusOutbound(false); enterLines(buildPrebodaLines()); }
      return;
    }
    if (stage === "bus-return") {
      const opts: ("none" | "23:00" | "1:45")[] = ["none", "23:00", "1:45"];
      setBusReturn(opts[cursor]);
      enterLines(buildPrebodaLines());
      return;
    }
    if (stage === "preboda-choice") {
      const pre = cursor === 0; setPreboda(pre);
      enterLines(buildFinaleLines());
      return;
    }
    if (stage === "done") {
      triggerEnding(preboda, busOutbound, busReturn, companion, allergyTxt);
      return;
    }
  });

  useEvent(Event.Up, () => {
    const mc = ["companion-choice","allergy-choice","bus-outbound","bus-return","preboda-choice"];
    if (mc.includes(stage)) { setCursor(c => Math.max(0, c - 1)); return; }
    if (stage === "children-select") setChildren(n => Math.min(5, n + 1));
  });

  useEvent(Event.Down, () => {
    const maxMap: Record<string, number> = {
      "companion-choice": 1, "allergy-choice": 1,
      "bus-outbound": 1,     "bus-return": 2,
      "preboda-choice": 1,
    };
    if (stage in maxMap) { setCursor(c => Math.min(maxMap[stage], c + 1)); return; }
    if (stage === "children-select") setChildren(n => Math.max(0, n - 1));
  });

  useEvent(Event.Left,  () => { if (stage === "children-select") setChildren(n => Math.max(0, n - 1)); });
  useEvent(Event.Right, () => { if (stage === "children-select") setChildren(n => Math.min(5, n + 1)); });

  const renderSprite = (sprite: SpriteId) => {
    switch (sprite) {
      case "oak":
        return <Portrait key="oak" src={oakPortrait} alt="" />;
      case "player":
        if (shrink === "shrinking") return <Portrait key="shrink" src={ashPortrait} alt="" $shrink />;
        if (shrink === "overworld") return <MapSprite key="map" src={ashDownSprite} alt="" />;
        return <Portrait key="player" src={ashPortrait} alt="" />;
      case "duo":
        return (
          <DuoWrap key="duo">
            <DuoPortrait src={sergioPortrait} alt="Sergio" />
            <DuoPortrait src={martaPortrait}  alt="Marta"  />
          </DuoWrap>
        );
      case "youngster":   return <Portrait key="y" src={youngsterPortrait} alt="" />;
      case "biker":       return <Portrait key="b" src={bikerPortrait} alt="" />;
      case "hiker":       return <Portrait key="h" src={hikerPortrait} alt="" />;
      case "pokemon113":  return chansey ? <PokemonImg key="c" src={chansey.images.front} alt="" /> : null;
      case "pokemon122":  return mrMime  ? <PokemonImg key="m" src={mrMime.images.front}  alt="" /> : null;
      case "pokemon132":  return ditto   ? <PokemonImg key="d" src={ditto.images.front}   alt="" /> : null;
      default: return null;
    }
  };

  const renderChoice = () => {
    if (["companion-choice", "allergy-choice", "bus-outbound", "preboda-choice"].includes(stage))
      return (
        <ChoicePanel>
          <ChoiceItem $selected={cursor === 0}>SÍ</ChoiceItem>
          <ChoiceItem $selected={cursor === 1}>NO</ChoiceItem>
        </ChoicePanel>
      );
    if (stage === "children-select")
      return (
        <NumberBox>
          <ArrowLbl onClick={() => setChildren(n => Math.max(0, n - 1))}>–</ArrowLbl>
          <NumberLabel>{children}</NumberLabel>
          <ArrowLbl onClick={() => setChildren(n => Math.min(5, n + 1))}>+</ArrowLbl>
        </NumberBox>
      );
    if (stage === "bus-return")
      return (
        <ChoicePanel>
          <ChoiceItem $selected={cursor === 0}>Sin vuelta</ChoiceItem>
          <ChoiceItem $selected={cursor === 1}>Vuelta 23:00</ChoiceItem>
          <ChoiceItem $selected={cursor === 2}>Vuelta 1:45</ChoiceItem>
        </ChoicePanel>
      );
    if (stage === "allergy-input")
      return (
        <AllergyWrap>
          <AllergyLabel>Indica alergias o intolerancias:</AllergyLabel>
          <AllergyTextarea
            autoFocus
            maxLength={200}
            value={allergyTxt}
            onChange={e => setAllergyTxt(e.target.value)}
            placeholder="Ej: sin gluten, sin lactosa..."
          />
          <ConfirmBtn onClick={() => enterLines(buildBusLines())}>CONFIRMAR</ConfirmBtn>
        </AllergyWrap>
      );
    return null;
  };

  if (stage === "name-picker")
    return (
      <Overlay>
        <NativeNamePicker
          prompt={"¿Cómo te llamas?"}
          onConfirm={name => {
            setPlayerName(name);
            enterLines(buildPostNameLines(name));
          }}
        />
      </Overlay>
    );

  if (stage === "companion-picker")
    return (
      <Overlay>
        <NativeNamePicker
          prompt={"¿Cómo se llama\ntu acompañante?"}
          onConfirm={name => {
            setCompanion(name);
            enterLines(buildChildrenIntro());
          }}
        />
      </Overlay>
    );

  if (stage === "saving" && shrink === "idle")
    return (
      <Overlay>
        <SpriteArea />
        <TextBox><SavingText>Guardando...</SavingText></TextBox>
      </Overlay>
    );

  const sprite = currentLine?.sprite ?? "oak";
  const CHOICE_STAGES: Stage[] = [
    "companion-choice", "children-select", "allergy-choice",
    "allergy-input", "bus-outbound", "bus-return", "preboda-choice",
  ];
  const showArrow = finished && !CHOICE_STAGES.includes(stage);

  return (
    <Overlay onClick={() => stage === "dialogue" && advanceDialogue()}>
      <SpriteArea>
        {renderSprite(sprite)}
        {renderChoice()}
      </SpriteArea>
      <TextBox>
        <DialogueText>{displayed}</DialogueText>
        <Arrow $visible={showArrow} />
      </TextBox>
    </Overlay>
  );
};

export default OakIntro;
