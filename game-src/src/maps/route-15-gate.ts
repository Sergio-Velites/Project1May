import image from "../assets/map/gate-house-route15.png";
import { MapType } from "./map-types";

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
  exits: {
    4: [0, 7],
    5: [0, 7],
  },
  grass: {},
};

export default route15Gate;
