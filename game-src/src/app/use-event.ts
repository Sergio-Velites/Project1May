import { useEffect, useRef } from "react";
import emitter, { Event } from "./emitter";

// `action` puede recibir un payload opcional emitido por `emitter.emit(event, payload)`.
// El tipo se mantiene amplio (any) porque el emisor garantiza el tipo concreto;
// el consumidor lo castea según el evento que escucha.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const useEvent = (event: Event, action: (payload?: any) => void) => {
  // Ref que siempre apunta a la versión MÁS RECIENTE de action.
  // Actualizarla durante el render (no en useEffect) garantiza que,
  // para el momento en que el handler del emitter se dispara,
  // actionRef.current ya tiene el closure con el estado actualizado.
  // Esto elimina el stale closure race-condition que ocurría con el
  // patrón anterior (useEffect([event, action])):
  //   render → DOM actualizado → useEffect se ejecuta DESPUÉS del paint
  //   → ventana donde el listener viejo captura estado obsoleto.
  const actionRef = useRef(action);
  actionRef.current = action;

  useEffect(() => {
    // El handler es estable (misma referencia) durante toda la vida del componente
    // para ese evento. Siempre delega en actionRef.current → siempre fresco.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (payload?: any) => actionRef.current(payload);
    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  }, [event]); // Solo re-registrar si cambia el tipo de evento
};

export default useEvent;
