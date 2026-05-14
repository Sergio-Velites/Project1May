import { useEffect, useRef, useState } from "react";
import useEvent from "./use-event";
import { Event } from "./emitter";

export interface UseDialogLineOptions {
  /** Texto completo de la línea actual. Cada cambio reinicia el typewriter. */
  text: string;
  /** Velocidad de typewriter ms/carácter. Por defecto 30 (Game Boy clásico). */
  speedMs?: number;
  /** Cooldown tras completar la línea antes de aceptar otro A/B. Por defecto 300 ms. */
  cooldownMs?: number;
  /** Callback cuando el usuario avanza tras línea completada y pasado el cooldown. */
  onAdvance: () => void;
  /** Si false, no se registran listeners ni se anima. */
  enabled?: boolean;
  /** Si true, también escucha Event.B además de Event.A. Por defecto true. */
  listenB?: boolean;
}

/**
 * Maneja un diálogo línea-a-línea con typewriter + avance A/B + cooldown.
 *
 * Comportamiento:
 *   1. Anima la línea carácter a carácter cada `speedMs`.
 *   2. Si el usuario pulsa A/B mientras se anima → completa la línea de golpe.
 *   3. Tras completarla (de cualquier forma), espera `cooldownMs` antes de
 *      aceptar el siguiente A/B para evitar avances accidentales por doble
 *      pulsación.
 *   4. Pasado el cooldown, A/B llaman a `onAdvance`.
 *
 * Devuelve `displayed` (substring actual) y `isComplete` para que el componente
 * pinte el texto y, si quiere, muestre el cursor parpadeante.
 */
export const useDialogLine = ({
  text,
  speedMs = 30,
  cooldownMs = 300,
  onAdvance,
  enabled = true,
  listenB = true,
}: UseDialogLineOptions) => {
  const [liveIndex, setLiveIndex] = useState(0);
  const completedAtRef = useRef<number | null>(null);
  const textRef = useRef(text);
  textRef.current = text;

  // Reinicia y anima cada vez que cambia el texto (o se habilita).
  useEffect(() => {
    if (!enabled) return;
    setLiveIndex(0);
    completedAtRef.current = null;
    if (text.length === 0) {
      completedAtRef.current = Date.now();
      return;
    }
    const id = setInterval(() => {
      setLiveIndex((p) => {
        const next = p + 1;
        if (next >= textRef.current.length) {
          if (completedAtRef.current === null) completedAtRef.current = Date.now();
          clearInterval(id);
          return textRef.current.length;
        }
        return next;
      });
    }, speedMs);
    return () => clearInterval(id);
  }, [text, speedMs, enabled]);

  const handle = () => {
    if (!enabled) return;
    if (liveIndex < textRef.current.length) {
      setLiveIndex(textRef.current.length);
      completedAtRef.current = Date.now();
      return;
    }
    if (completedAtRef.current === null) completedAtRef.current = Date.now();
    if (Date.now() - completedAtRef.current < cooldownMs) return;
    onAdvance();
  };

  useEvent(Event.A, handle);
  useEvent(Event.B, () => {
    if (listenB) handle();
  });

  return {
    displayed: text.substring(0, liveIndex),
    isComplete: liveIndex >= text.length,
  };
};

export default useDialogLine;
