/**
 * FishingSession — Sesión de pesca con caña (Old/Good/Super).
 *
 * Inicia el item de la caña (use-item-data.ts) tras detectar agua adyacente.
 * Flujo:
 *   1. casting (200 ms): aparece el sprite de la caña frente al jugador.
 *   2. waiting (1.5–3 s aleatorio): muestra texto progresivo "...".
 *   3. bite (50%) o no-bite:
 *      - bite → "¡Picó algo!" + A → encounter usando map.encounters[rod]
 *      - no-bite → "No pica nada..." + A → cierra
 *   4. Al terminar (combate o cancelación), la sesión se cierra y el jugador
 *      recupera los controles (selectMenuOpen excluye fishing al ser null).
 */
import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useDispatch, useSelector } from "react-redux";
import {
  endFishing,
  selectFishing,
  selectMenuOpen,
} from "../state/uiSlice";
import {
  encounterPokemon,
  selectMap,
  selectPokemonEncounter,
} from "../state/gameSlice";
import { PokemonEncounterData } from "../maps/map-types";
import { Direction, PokemonEncounterType } from "../state/state-types";
import getPokemonEncounter from "../app/pokemon-encounter-helper";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import Frame from "./Frame";

// Tirada ponderada de pokémon (igual que EncounterHandler).
const randBetween = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

const pickFromTable = (
  options: PokemonEncounterData[]
): PokemonEncounterType | null => {
  if (!options || options.length === 0) return null;
  const total = options.reduce((acc, cur) => acc + cur.chance, 0);
  let r = Math.random() * total;
  for (const opt of options) {
    r -= opt.chance;
    if (r < 0) {
      return getPokemonEncounter(opt.id, randBetween(opt.minLevel, opt.maxLevel));
    }
  }
  return null;
};

const TextOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 30%;
  z-index: 1500;
`;

type Phase = "casting" | "waiting" | "bite" | "no-bite";

// En el agua siempre debe picar algo (regla de diseño WeddingBoy:
// nunca aparece "no pica nada"). Mantenemos la fase "no-bite" en el tipo
// por si en el futuro se reintroduce, pero la rama nunca se activa.
const CASTING_MS = 350;
const WAITING_MS_MIN = 1500;
const WAITING_MS_MAX = 3000;

// Fallback de captura cuando el mapa no tiene tabla configurada para la
// caña usada: Magikarp (id 129) en un rango de niveles según la caña.
const FALLBACK_BY_ROD: Record<"old-rod" | "good-rod" | "super-rod", { id: number; min: number; max: number }> = {
  "old-rod":   { id: 129, min: 5,  max: 10 },
  "good-rod":  { id: 129, min: 10, max: 20 },
  "super-rod": { id: 129, min: 15, max: 30 },
};

const FishingSession = () => {
  const dispatch = useDispatch();
  const fishing = useSelector(selectFishing);
  const map = useSelector(selectMap);
  const encounter = useSelector(selectPokemonEncounter);
  const menuOpenIgnoringFishing = useSelector(
    (s: Parameters<typeof selectMenuOpen>[0]) => {
      // selectMenuOpen incluye fishing → no podemos usarlo aquí.
      // En su lugar evaluamos manualmente: si hay otro menú abierto
      // (texto, etc.) bloqueamos la animación pero no cerramos.
      return false;
    }
  );
  void menuOpenIgnoringFishing; // reservado por si se quiere bloquear en futuro

  const [phase, setPhase] = useState<Phase>("casting");
  const [dots, setDots] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  // Reset al iniciar una nueva sesión de pesca
  useEffect(() => {
    if (!fishing) return;
    setPhase("casting");
    setDots(0);
    startedAtRef.current = Date.now();
  }, [fishing]);

  // Si arranca un combate (encounter), cerramos la sesión.
  useEffect(() => {
    if (fishing && encounter) {
      dispatch(endFishing());
    }
  }, [encounter, fishing, dispatch]);

  // Máquina de fases: casting → waiting → bite/no-bite
  useEffect(() => {
    if (!fishing) return;

    if (phase === "casting") {
      const t = setTimeout(() => setPhase("waiting"), CASTING_MS);
      return () => clearTimeout(t);
    }

    if (phase === "waiting") {
      // Animación de puntos cada 500 ms
      const dotInterval = setInterval(() => {
        setDots((d) => (d + 1) % 4);
      }, 500);

      // Decisión de bite tras delay aleatorio
      const wait = randBetween(WAITING_MS_MIN, WAITING_MS_MAX);
      // Decisión de bite tras delay aleatorio. En el agua siempre pica
      // (regla de diseño WeddingBoy).
      const decide = setTimeout(() => {
        setPhase("bite");
      }, wait);

      return () => {
        clearInterval(dotInterval);
        clearTimeout(decide);
      };
    }
  }, [phase, fishing, map.encounters]);

  // A/B durante bite → lanza encounter; durante no-bite → cierra.
  const handleAdvance = () => {
    if (!fishing) return;
    if (phase === "bite") {
      const enc = map.encounters;
      const table =
        fishing.rod === "old-rod"
          ? enc?.oldRod?.pokemon ?? []
          : fishing.rod === "good-rod"
          ? enc?.goodRod?.pokemon ?? []
          : enc?.superRod?.pokemon ?? [];
      let pkmn = pickFromTable(table);
      if (!pkmn) {
        // Fallback: el agua nunca debe quedarse sin captura.
        const fb = FALLBACK_BY_ROD[fishing.rod];
        pkmn = getPokemonEncounter(fb.id, randBetween(fb.min, fb.max));
      }
      dispatch(encounterPokemon(pkmn));
      // endFishing se dispara desde el efecto al detectar encounter
      return;
    }
    if (phase === "no-bite") {
      dispatch(endFishing());
    }
  };

  useEvent(Event.A, handleAdvance);
  useEvent(Event.B, handleAdvance);

  if (!fishing) return null;

  const message =
    phase === "casting"
      ? "..."
      : phase === "waiting"
      ? ".".repeat(Math.max(1, dots) || 1)
      : phase === "bite"
      ? "¡Picó algo!"
      : "No pica nada...";

  return (
    <>
      <RodSprite direction={fishing.direction} />
      <TextOverlay>
        <Frame wide tall flashing={phase === "bite" || phase === "no-bite"}>
          {message}
        </Frame>
      </TextOverlay>
    </>
  );
};

/**
 * Sprite simple de la caña: un palito oscuro con cabeza al final,
 * orientado según la dirección del jugador.
 *
 * Geometría: el rod es una barra vertical anclada por su extremo
 * superior al centro del tile del jugador, y se rota según dirección:
 *   - Down  →   0°  (cae hacia abajo, agua abajo)
 *   - Up    → 180°  (sube hacia arriba, agua arriba)
 *   - Right → -90°  (gira al este)
 *   - Left  →  90°  (gira al oeste)
 *
 * El "flotador" (.bob) está en el extremo opuesto al ancla, así siempre
 * cae sobre el agua. El z-index sitúa la caña detrás del jugador cuando
 * apunta hacia arriba, y delante en el resto de direcciones.
 */
const RodOverlay = styled.div<{ $dir: Direction }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.4cqw;
  height: 6.5cqw;
  background: #181010;
  transform-origin: top center;
  transform: translate(-50%, 0)
    rotate(
      ${(p) =>
        p.$dir === Direction.Up
          ? 180
          : p.$dir === Direction.Right
          ? -90
          : p.$dir === Direction.Left
          ? 90
          : 0}deg
    );
  z-index: ${(p) => (p.$dir === Direction.Up ? 4 : 12)};
  pointer-events: none;
  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1cqw;
    height: 1cqw;
    background: #181010;
    border-radius: 50%;
  }
`;

const RodSprite = ({ direction }: { direction: Direction }) => {
  return <RodOverlay $dir={direction} />;
};

export default FishingSession;
