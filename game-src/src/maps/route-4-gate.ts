import image from "../assets/map/route-4-gate.png";
import { MapType } from "./map-types";

const route4Gate: MapType = {
  name: "Caseta Ruta 4",
  image,
  height: 8,
  width: 10,
  start: { x: 5, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 6, 7, 8, 9],
    2: [0, 6, 8, 9],
    3: [0, 6, 8, 9],
    4: [0, 9],
    5: [0, 6, 8, 9],
    6: [0, 6, 8, 9],
    7: [0, 9],
  },
  text: {},
  maps: {

  },
  exits: {
    0: [4, 5],
    7: [4, 5],
  },
  grass: {},
  minimapPos: { x: 148, y: 75 },
};

export default route4Gate;
