import { useEffect, useRef } from "react";
import emitter, { Event } from "./emitter";

const useEvent = (event: Event, action: () => void) => {
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
    const handler = () => actionRef.current();
    emitter.on(event, handler);
    return () => {
      emitter.off(event, handler);
    };
  }, [event]); // Solo re-registrar si cambia el tipo de evento
};

export default useEvent;
