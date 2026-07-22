import image from "../assets/map/underground-path-ew.png";
import { MapId, MapType } from "./map-types";

const undergroundPathEW: MapType = {
  name: "Camino Subterráneo E-O",
  image,
  height: 8,
  width: 50,
  start: { x: 10, y: 5 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    1: [0, 1, 48, 49],
    2: [0, 1, 48, 49],
    3: [0, 1, 48, 49],
    4: [0, 1, 48, 49],
    5: [0, 1, 48, 49],
    6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    7: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
  },
  text: {},
  maps: {

  },
  teleports: {
    // Escalera este (47,2) → caseta de Ruta 8
    2: { 47: { map: MapId.Route8, pos: { x: 13, y: 4 } } },
    // Escalera oeste (2,5) → caseta de Ruta 7
    5: { 2: { map: MapId.Route7, pos: { x: 5, y: 14 } } },
  },
  exits: {

  },
  grass: {},
};

export default undergroundPathEW;
