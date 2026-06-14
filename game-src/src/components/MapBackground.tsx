import styled from "styled-components";
import { useCallback, useEffect, useRef, useState } from "react";

import PixelImage from "../styles/PixelImage";
import { xToPx, yToPx } from "../app/position-helper";
import emitter, { Event } from "../app/emitter";

interface BackgroundProps {
  width: number;
  height: number;
}

const Background = styled(PixelImage)<BackgroundProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: ${(props) => xToPx(props.width)};
  height: ${(props) => yToPx(props.height)};
`;

interface MapBackgroundProps {
  image: string;
  width: number;
  height: number;
}

/**
 * Imagen de fondo del mapa con carga "a prueba de parpadeos".
 *
 * El tamaño de cada tile se calcula en unidades `cqw` (container query) que
 * tardan un frame en resolverse tras el gran cambio de DOM que supone cambiar
 * de mapa. Si el telón negro se levantara antes de que la nueva imagen esté
 * cargada y pintada, se vería un fotograma con el mapa a una escala incorrecta.
 *
 * Para evitarlo: mientras la imagen del mapa actual no haya cargado se mantiene
 * oculta (`visibility: hidden`, conserva la caja para que los `cqw` se
 * resuelvan) y, una vez cargada y pintada (doble `requestAnimationFrame`), se
 * emite `Event.MapReady` para que `MapChangeHandler` levante el telón.
 */
const MapBackground = ({ image, width, height }: MapBackgroundProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [readySrc, setReadySrc] = useState<string | null>(null);

  const handleLoaded = useCallback((src: string) => {
    setReadySrc(src);
    // Esperar a que el navegador haya pintado los nuevos tiles a la escala
    // correcta (los `cqw` ya resueltos) antes de avisar de que el mapa está
    // listo. Un doble rAF garantiza que el frame ya se compuso.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => emitter.emit(Event.MapReady)),
    );
  }, []);

  // Las imágenes ya cacheadas pueden disparar su evento `load` antes de que
  // React adjunte `onLoad` (al revisitar un mapa). Reconciliamos aquí.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      handleLoaded(image);
    }
  }, [image, handleLoaded]);

  const ready = readySrc === image;

  return (
    <Background
      ref={imgRef}
      src={image}
      width={width}
      height={height}
      style={{ visibility: ready ? "visible" : "hidden" }}
      onLoad={() => handleLoaded(image)}
    />
  );
};

export default MapBackground;
