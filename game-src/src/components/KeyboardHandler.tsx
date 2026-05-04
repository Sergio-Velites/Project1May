import { useEffect } from "react";
import { useDispatch } from "react-redux";
import emitter, { Event } from "../app/emitter";

const KeyboardHandler = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          emitter.emit(Event.Up);
          emitter.emit(Event.StartUp);
          break;
        case "ArrowDown":
          emitter.emit(Event.Down);
          emitter.emit(Event.StartDown);
          break;
        case "ArrowLeft":
          emitter.emit(Event.Left);
          emitter.emit(Event.StartLeft);
          break;
        case "ArrowRight":
          emitter.emit(Event.Right);
          emitter.emit(Event.StartRight);
          break;
        // Botón A → tecla +
        case "+":
        case "Add":
          emitter.emit(Event.A);
          break;
        // Botón B → tecla -
        case "-":
        case "Subtract":
          emitter.emit(Event.B);
          break;
        // START → Enter (Intro)
        case "Enter":
          emitter.emit(Event.Start);
          break;
        // SELECT → punto
        case ".":
          emitter.emit(Event.Select);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowUp":
          emitter.emit(Event.StopUp);
          break;
        case "ArrowDown":
          emitter.emit(Event.StopDown);
          break;
        case "ArrowLeft":
          emitter.emit(Event.StopLeft);
          break;
        case "ArrowRight":
          emitter.emit(Event.StopRight);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [dispatch]);

  return null;
};

export default KeyboardHandler;
