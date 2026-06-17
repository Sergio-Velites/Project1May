import image from "../assets/map/diglets-cave.png";
import { MapType } from "./map-types";

const digletsCave: MapType = {
  name: "Cueva Diglett",
  image,
  height: 8,
  width: 8,
  start: { x: 5, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 2, 3, 4, 5, 6, 7],
    2: [0, 6, 7],
    3: [0, 6, 7],
    4: [0, 6, 7],
    5: [0, 6, 7],
    6: [0, 6, 7],
    7: [0, 1, 4, 5, 6, 7],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  grass: {},
  minimapPos: { x: 84, y: 105 },
};

export default digletsCave;
