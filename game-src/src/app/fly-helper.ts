import mapData from "../maps/map-data";
import { MapId } from "../maps/map-types";
import { PosType } from "../state/state-types";

/**
 * Destino de la MO Vuelo derivado de los datos del mapa (NO hardcodeado).
 *
 * Un mapa es destino de Vuelo si y solo si en su `.ts` (editable desde el Map
 * Editor) cumple las TRES condiciones:
 *   - `flyable === true`        → marcado como destino de Vuelo
 *   - `minimapPos` definido     → punto sobre kanto_region.png (237×213)
 *   - `flySpot` definido        → casilla de aterrizaje
 *
 * Conforme se añadan mapas con estos campos, aparecerán automáticamente en el
 * mapa de Kanto sin tocar este archivo.
 */
export interface FlyDestination {
  map: MapId;
  /** Nombre mostrado (el del mapa, en mayúsculas). */
  name: string;
  /** Punto en el minimapa de Kanto (píxeles sobre 237×213). */
  minimapPos: PosType;
  /** Casilla de aterrizaje al volar aquí. */
  flySpot: PosType;
  /** Disponible desde el inicio sin pisar casillas de desbloqueo. */
  alwaysAvailable: boolean;
}

/** Dimensiones del PNG del minimapa de Kanto (fuente de verdad para %). */
export const KANTO_MINIMAP_WIDTH = 237;
export const KANTO_MINIMAP_HEIGHT = 201;

/**
 * Todos los destinos de Vuelo configurados en los mapas. Se calcula una vez
 * (mapData es estático en runtime). El filtrado por disponibilidad
 * (`flyAlwaysAvailable` o desbloqueo vía `unlockedFlyMaps`) se hace en el
 * componente, porque depende del estado de la partida.
 */
export const getAllFlyDestinations = (): FlyDestination[] =>
  (Object.keys(mapData) as MapId[])
    .filter((id) => {
      const m = mapData[id];
      return !!m && m.flyable === true && !!m.minimapPos && !!m.flySpot;
    })
    .map((id) => {
      const m = mapData[id];
      return {
        map: id,
        name: (m.name ?? id).toUpperCase(),
        minimapPos: m.minimapPos as PosType,
        flySpot: m.flySpot as PosType,
        alwaysAvailable: m.flyAlwaysAvailable === true,
      };
    });
