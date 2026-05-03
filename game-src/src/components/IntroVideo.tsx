import styled from "styled-components";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectGameboyMenu } from "../state/uiSlice";
import useEvent from "../app/use-event";
import { Event } from "../app/emitter";
import introSrc from "../assets/video/intro.mp4";

// El video se reproduce siempre después de que el usuario cierra el GameboyMenu (pantalla de arranque)

const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 1002;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const IntroVideo = () => {
  const gameboyOpen = useSelector(selectGameboyMenu);
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Activar el video en el momento en que el GameboyMenu se cierra
  useEffect(() => {
    if (!gameboyOpen) {
      setActive(true);
    }
  }, [gameboyOpen]);

  const skip = useCallback(() => {
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;

    const video = videoRef.current;
    if (!video) return;

    const tryPlay = () => {
      video.play().catch(() => {
        // Autoplay bloqueado por el navegador; esperar interacción del usuario
      });
    };

    tryPlay();

    // En móvil, el primer toque/clic desbloquea el audio
    const handleFirstInteraction = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
      document.removeEventListener("touchend", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };

    document.addEventListener("touchend", handleFirstInteraction);
    document.addEventListener("click", handleFirstInteraction);

    return () => {
      document.removeEventListener("touchend", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
    };
  }, [active]);

  useEvent(Event.A, skip);
  useEvent(Event.B, skip);

  if (!active) return null;

  return (
    <Overlay>
      <Video
        ref={videoRef}
        src={introSrc}
        autoPlay
        playsInline
        onEnded={skip}
      />
    </Overlay>
  );
};

export default IntroVideo;
