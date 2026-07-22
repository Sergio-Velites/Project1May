import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  registerFlyUnlock,
  selectMapId,
  selectPos,
  selectUnlockedFlyMaps,
} from "../state/gameSlice";
import mapData from "../maps/map-data";

/**
 * Desbloqueo de destinos de Vuelo por pisada. Cuando el jugador pisa una
 * casilla de `flyUnlockTiles` del mapa actual, ese mapa queda registrado en
 * `unlockedFlyMaps` (persistido al guardar) y aparecerá en el menú de Vuelo.
 *
 * Mismo patrón que QuestHandler: es el único sitio que reacciona a `pos` para
 * esta lógica; no toca los reducers de movimiento. Idempotente y barato (un
 * lookup en el Record de casillas). Los mapas con `flyAlwaysAvailable` no
 * necesitan esto (están disponibles sin desbloquear).
 */
const FlyUnlockHandler = () => {
  const dispatch = useDispatch();
  const mapId = useSelector(selectMapId);
  const pos = useSelector(selectPos);
  const unlocked = useSelector(selectUnlockedFlyMaps);

  useEffect(() => {
    if (unlocked.includes(mapId)) return; // ya desbloqueado
    const map = mapData[mapId];
    const tiles = map?.flyUnlockTiles;
    if (!tiles) return;
    const row = tiles[pos.y];
    if (row && row.includes(pos.x)) {
      dispatch(registerFlyUnlock(mapId));
    }
  }, [mapId, pos, unlocked, dispatch]);

  return null;
};

export default FlyUnlockHandler;
