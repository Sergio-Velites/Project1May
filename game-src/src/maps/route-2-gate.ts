import image from "../assets/map/route-2-gate.png";
import { MapId, MapType } from "./map-types";

const route2Gate: MapType = {
  name: "Control Ruta 2",
  image,
  height: 8,
  width: 10,
  start: {
    x: 4,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 6, 7, 8, 9],
    2: [0, 6, 8, 9],
    3: [0, 6, 8, 9],
    4: [0, 9],
    5: [0, 6, 8, 9],
    6: [0, 6, 8, 9],
    7: [0, 9],
  },
  fences: {},
  grass: {},
  text: {},
  maps: {

  },
  exits: {
    0: [4, 5],
    7: [4, 5],
  },
  exitReturnPos: {
    x: 3,
    y: 44,
  },
  exitReturnMap: MapId.Route2,
  minimapPos: { x: 84, y: 105 },
};

export default route2Gate;
