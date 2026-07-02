import image from "../assets/map/route-15-gate.png";
import { MapId, MapType } from "./map-types";

const route15Gate: MapType = {
  name: "Caseta Ruta 15",
  image,
  height: 10,
  width: 8,
  start: { x: 5, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 7],
    2: [0, 1, 2, 3, 4, 5, 6, 7],
    7: [0, 1, 2, 3, 4, 6, 7],
    8: [0, 4, 7],
    9: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  text: {},
  maps: {

  },
  exits: {},
  teleports: {
    // Pasaje E-O: oeste (col 0) ↔ este (col 7) de Ruta 15
    4: { 0: { map: MapId.Route15, pos: { x: 6, y: 8 } }, 7: { map: MapId.Route15, pos: { x: 15, y: 8 } } },
    5: { 0: { map: MapId.Route15, pos: { x: 6, y: 9 } }, 7: { map: MapId.Route15, pos: { x: 15, y: 9 } } },
  },
  grass: {},
  minimapPos: { x: 138, y: 151 },
};

export default route15Gate;
