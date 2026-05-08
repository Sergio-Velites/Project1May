import { useState, useEffect, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";

// 4 filas × 7 cols — caben en la pantalla del Game Boy
// Fila 4 (END_ROW) = botón FIN siempre visible
const ROWS = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N"],
  ["O", "P", "Q", "R", "S", "T", "U"],
  ["V", "W", "X", "Y", "Z", " ", "DEL"],
];
const NUM_ROWS = ROWS.length;   // 4
const END_ROW = NUM_ROWS;       // fila 4 = botón FIN
const TOTAL_ROWS = NUM_ROWS + 1;
const MAX_LEN = 7;

const blink = keyframes`
  50% { opacity: 0; }
`;

const Wrapper = styled.div`
  position: absolute;
  inset: 0;
  z-index: 2000;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  padding: 3% 3% 2%;
  gap: 2%;
`;

const NameDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 3px solid black;
  padding-bottom: 2%;
  min-height: 11%;
  gap: 0.5em;
  border-bottom: 2px solid black;
`;

interface CharProps {
  $filled: boolean;
}

const Char = styled.span<CharProps>`
  font-family: "PokemonGB";
  font-size: 2.67cqw;
  color: black;
  width: 1.1em;
  text-align: center;
  border-bottom: ${(p) => (p.$filled ? "none" : "2px solid black")};
`;

const Cursor = styled.span`
  font-family: "PokemonGB";
  font-size: 2.67cqw;
  color: black;
  animation: ${blink} 0.8s step-start infinite;
`;

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-rows: repeat(${NUM_ROWS}, 1fr);
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
`;

interface KeyProps {
  $active: boolean;
  $wide: boolean;
}

const Key = styled.button<KeyProps>`
  font-family: "PokemonGB";
  font-size: ${(p) => (p.$wide ? "1.87cqw" : "2.4cqw")};
  background: ${(p) => (p.$active ? "black" : "var(--bg)")};
  color: ${(p) => (p.$active ? "var(--bg)" : "black")};
  display: flex;
  align-items: center;
  justify-content: center;
  border: ${(p) => (p.$active ? "none" : "1px solid transparent")};
  cursor: pointer;
  padding: 0;
  line-height: 1;
`;

interface EndBtnProps {
  $active: boolean;
}

const EndButton = styled.button<EndBtnProps>`
  font-family: "PokemonGB";
  font-size: 2.4cqw;
  width: 100%;
  padding: 4% 0;
  background: ${(p) => (p.$active ? "black" : "var(--bg)")};
  color: ${(p) => (p.$active ? "var(--bg)" : "black")};
  border: 2px solid black;
  cursor: pointer;
  letter-spacing: 0.15em;
`;

const MobileKeyboardBtn = styled.button`
  font-family: "PokemonGB";
  font-size: 1.87cqw;
  padding: 3% 5%;
  background: var(--bg);
  color: black;
  border: 2px solid black;
  cursor: pointer;
  letter-spacing: 0.1em;
  flex: 1;
`;

const BottomRow = styled.div`
  display: flex;
  gap: 2%;
  flex-shrink: 0;
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 1px;
  height: 1px;
  pointer-events: none;
  top: 0;
  left: 0;
`;

interface Props {
  onConfirm: (name: string) => void;
}

const NameKeyboard = ({ onConfirm }: Props) => {
  const [chars, setChars] = useState<string[]>([]);
  const [row, setRow] = useState(0);
  const [col, setCol] = useState(0);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  const handleKey = useCallback(
    (key: string) => {
      if (key === "DEL") {
        setChars((prev) => prev.slice(0, -1));
      } else if (key === "END") {
        const name = chars.join("").trim();
        if (name.length > 0) onConfirm(name);
      } else if (chars.length < MAX_LEN) {
        setChars((prev) => [...prev, key]);
      }
    },
    [chars, onConfirm]
  );

  const pressCurrentKey = useCallback(() => {
    if (row === END_ROW) {
      handleKey("END");
    } else {
      handleKey(ROWS[row][col]);
    }
  }, [row, col, handleKey]);

  // Teclado físico — escritura directa de letras + navegación del grid
  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      // Escritura directa: cualquier letra o espacio escribe en el nombre
      if (e.key.length === 1 && /[a-zA-Z ]/.test(e.key)) {
        e.preventDefault();
        const letter = e.key.toUpperCase();
        setChars((prev) => (prev.length < MAX_LEN ? [...prev, letter] : prev));
        return;
      }
      // Borrar con Backspace o Delete
      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        setChars((prev) => prev.slice(0, -1));
        return;
      }
      // Confirmar con Enter
      if (e.key === "Enter") {
        e.preventDefault();
        handleKey("END");
        return;
      }
      // Navegación del grid (por si el usuario prefiere usar el grid)
      if (e.key === "ArrowUp")
        setRow((r) => (r - 1 + TOTAL_ROWS) % TOTAL_ROWS);
      else if (e.key === "ArrowDown")
        setRow((r) => (r + 1) % TOTAL_ROWS);
      else if (e.key === "ArrowLeft")
        setCol((c) => (c - 1 + 7) % 7);
      else if (e.key === "ArrowRight")
        setCol((c) => (c + 1) % 7);
      else if (e.key === "+" || e.key === "Add")
        pressCurrentKey();
      else if (e.key === "-" || e.key === "Subtract")
        handleKey("DEL");
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [pressCurrentKey, handleKey]);

  // Teclado nativo móvil — sincronizar el input oculto con chars
  const handleHiddenInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.toUpperCase().replace(/[^A-Z ]/g, "");
      const limited = raw.slice(0, MAX_LEN).split("");
      setChars(limited);
      // Mantener el cursor al final del input
      const el = e.target;
      requestAnimationFrame(() => {
        el.setSelectionRange(el.value.length, el.value.length);
      });
    },
    []
  );

  const openMobileKeyboard = () => {
    const el = hiddenInputRef.current;
    if (!el) return;
    // Sincronizar valor actual antes de abrir
    el.value = chars.join("");
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  };

  // Botones Game Boy on-screen via emitter
  useEvent(
    Event.Up,
    useCallback(() => setRow((r) => (r - 1 + TOTAL_ROWS) % TOTAL_ROWS), [])
  );
  useEvent(
    Event.Down,
    useCallback(() => setRow((r) => (r + 1) % TOTAL_ROWS), [])
  );
  useEvent(
    Event.Left,
    useCallback(() => setCol((c) => (c - 1 + 7) % 7), [])
  );
  useEvent(
    Event.Right,
    useCallback(() => setCol((c) => (c + 1) % 7), [])
  );
  useEvent(Event.A, pressCurrentKey);
  useEvent(Event.B, useCallback(() => handleKey("DEL"), [handleKey]));

  const slots = Array.from({ length: MAX_LEN });

  return (
    <Wrapper>
      {/* Input oculto para teclado nativo en móvil */}
      <HiddenInput
        ref={hiddenInputRef}
        type="text"
        maxLength={MAX_LEN}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck={false}
        onChange={handleHiddenInput}
        onKeyDown={(e) => {
          // Confirmar con Enter desde el teclado nativo
          if (e.key === "Enter") { e.preventDefault(); handleKey("END"); }
        }}
      />

      <NameDisplay>
        {slots.map((_, i) => {
          const ch = chars[i];
          if (i === chars.length && chars.length < MAX_LEN) {
            return <Cursor key={i}>▼</Cursor>;
          }
          return (
            <Char key={i} $filled={!!ch}>
              {ch ?? ""}
            </Char>
          );
        })}
      </NameDisplay>

      <Grid>
        {ROWS.map((rowKeys, r) =>
          rowKeys.map((key, c) => (
            <Key
              key={`${r}-${c}`}
              $active={row === r && col === c}
              $wide={key.length > 1}
              onClick={() => {
                setRow(r);
                setCol(c);
                handleKey(key);
              }}
            >
              {key === " " ? "·" : key}
            </Key>
          ))
        )}
      </Grid>

      {/* Fila inferior: teclado nativo (móvil) + FIN, siempre visibles */}
      <BottomRow>
        <MobileKeyboardBtn onClick={openMobileKeyboard} type="button">
          ⌨ TECLADO
        </MobileKeyboardBtn>
        <EndButton $active={row === END_ROW} onClick={() => handleKey("END")} style={{ flex: 2 }}>
          FIN
        </EndButton>
      </BottomRow>
    </Wrapper>
  );
};

export default NameKeyboard;
