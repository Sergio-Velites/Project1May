import image from "../assets/map/gate-house.png";
import { MapType } from "./map-types";

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
  exits: {
    0: [4, 5],
    7: [4, 5],
  },
  grass: {},
};

export default route12Gate;
