import image from "../assets/map/route-16-gate.png";
import { MapType } from "./map-types";

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
  exits: {
    2: [0, 7],
    3: [0, 7],
    8: [0, 7],
    9: [0, 7],
  },
  grass: {},
};

export default route16Gate;
