import image from "../assets/map/route-11.png";
import { Direction } from "../state/state-types";import { MapType } from "./map-types";

const route11: MapType = {
  name: "Ruta 11",
  image,
  height: 18,
  width: 60,
  start: { x: 25, y: 17 },
  walls: {
    0: [8, 56, 57, 58, 59],
    1: [8, 56, 57, 58, 59],
    2: [2, 3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    3: [3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    4: [3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    5: [0, 1, 8, 48, 56, 57, 58, 59],
    6: [50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    7: [46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    8: [0, 1, 2, 3, 4, 5, 6, 7, 8, 50, 51, 52, 53, 54, 55, 56, 57],
    9: [0, 1, 2, 3, 4, 5, 6, 7, 8, 50, 51, 52, 53, 54, 55, 56, 57],
    10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 46, 47, 48, 49, 56, 57, 58, 59],
    11: [0, 1, 2, 3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    13: [0, 1, 2, 3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    14: [0, 1, 2, 3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 56, 57, 58, 59],
    16: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 56, 57, 58, 59],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 56, 57, 58, 59],
  },
  fenceDirections: {
    3: { 2: Direction.Left },
    4: { 2: Direction.Left },
    5: { 2: Direction.Down, 3: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down },
  },
  fences: {
    3: [2],
    4: [2],
    5: [2, 3, 5, 6, 7],
  },
  text: {},
  maps: {
    0: { 0: MapId.VermilionCity },
    1: { 0: MapId.VermilionCity },
    2: { 0: MapId.VermilionCity },
    3: { 0: MapId.VermilionCity },
    4: { 0: MapId.VermilionCity },
    6: { 0: MapId.VermilionCity },
    7: { 0: MapId.VermilionCity },
    8: { 59: MapId.Route12 },
    9: { 59: MapId.Route12 },
  },
  exits: {

  },
  music: "/game/music/maps-original/route-11.mp3",
  grass: {},
  minimapPos: { x: 160, y: 123 },
};

export default route11;
