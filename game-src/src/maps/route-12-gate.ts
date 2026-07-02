import image from "../assets/map/route-12-gate.png";
import { MapId, MapType } from "./map-types";

const route12Gate: MapType = {
  name: "Caseta Ruta 12",
  image,
  height: 8,
  width: 10,
  start: { x: 5, y: 6 },
  walls: {
    0: [0, 1, 2, 7, 8, 9],
    1: [0, 1, 2, 7, 8, 9],
    2: [0, 2, 7, 9],
    3: [0, 2, 7, 9],
    4: [0, 2, 7, 8, 9],
    5: [0, 2, 9],
    6: [0, 2, 7, 9],
    7: [0, 1, 2, 7, 8, 9],
  },
  text: {},
  maps: {

  },
  exits: {},
  teleports: {
    // Pasaje N-S: norte (row 0) ↔ sur (row 7) de Ruta 12
    0: { 4: { map: MapId.Route12, pos: { x: 10, y: 14 } }, 5: { map: MapId.Route12, pos: { x: 11, y: 14 } } },
    7: { 4: { map: MapId.Route12, pos: { x: 10, y: 22 } }, 5: { map: MapId.Route12, pos: { x: 11, y: 22 } } },
  },
  grass: {},
  minimapPos: { x: 196, y: 95 },
};

export default route12Gate;
