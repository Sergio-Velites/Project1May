import image from "../assets/map/route-16-gate.png";
import { MapId, MapType } from "./map-types";

const route16Gate: MapType = {
  name: "Caseta Ruta 16",
  image,
  height: 14,
  width: 8,
  start: { x: 5, y: 7 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 2, 3, 4, 5, 6, 7],
    4: [0, 1, 2, 3, 4, 5, 6, 7],
    5: [0, 7],
    6: [0, 1, 2, 3, 4, 5, 6, 7],
    11: [0, 1, 2, 3, 4, 6, 7],
    12: [0, 4, 7],
    13: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  text: {},
  maps: {

  },
  exits: {},
  teleports: {
    // Pasaje superior (rows 2-3): oeste (col 0) ↔ este (col 7) de Ruta 16
    2: { 0: { map: MapId.Route16, pos: { x: 16, y: 4 } }, 7: { map: MapId.Route16, pos: { x: 25, y: 4 } } },
    3: { 0: { map: MapId.Route16, pos: { x: 16, y: 5 } }, 7: { map: MapId.Route16, pos: { x: 25, y: 5 } } },
    // Pasaje inferior (rows 8-9): oeste (col 0) ↔ este (col 7) de Ruta 16
    8: { 0: { map: MapId.Route16, pos: { x: 16, y: 10 } }, 7: { map: MapId.Route16, pos: { x: 25, y: 10 } } },
    9: { 0: { map: MapId.Route16, pos: { x: 16, y: 11 } }, 7: { map: MapId.Route16, pos: { x: 25, y: 10 } } },
  },
  grass: {},
};

export default route16Gate;
