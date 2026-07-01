import image from "../assets/map/route-15.png";
import { Direction } from "../state/state-types";import { MapType } from "./map-types";

const route15: MapType = {
  name: "Ruta 15",
  image,
  height: 18,
  width: 60,
  start: { x: 20, y: 13 },
  walls: {
    0: [56, 57, 58, 59],
    1: [56, 57, 58, 59],
    2: [56, 57, 58, 59],
    3: [0, 1, 2, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    4: [0, 1, 2, 3, 14],
    5: [0, 1, 2, 3, 14],
    6: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14],
    7: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    8: [8, 9, 10, 11, 12, 13],
    9: [8, 9, 10, 11, 12, 13, 39],
    10: [0, 1, 2, 3, 4, 5, 6, 7, 14],
    11: [0, 1, 2, 3, 14],
    12: [0, 1, 2, 3, 14],
    13: [0, 1, 2, 3, 14],
    14: [0, 1, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  },
  fenceDirections: {
    7: { 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 35: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down, 40: Direction.Down, 41: Direction.Down, 42: Direction.Down, 43: Direction.Down, 44: Direction.Down, 45: Direction.Down, 46: Direction.Down, 47: Direction.Down, 48: Direction.Down, 49: Direction.Down, 50: Direction.Down, 51: Direction.Down, 52: Direction.Down, 53: Direction.Down, 54: Direction.Down, 55: Direction.Down, 56: Direction.Down, 57: Direction.Down, 58: Direction.Down, 59: Direction.Down },
  },
  fences: {
    7: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  },
  text: {},
  maps: {
    0: { 0: MapId.FuchsiaCity },
    1: { 0: MapId.FuchsiaCity },
    2: { 0: MapId.FuchsiaCity },
    4: { 59: MapId.Route14 },
    5: { 59: MapId.Route14 },
    6: { 59: MapId.Route14 },
    7: { 59: MapId.Route14 },
    8: { 0: MapId.FuchsiaCity, 7: MapId.Route15Gate, 14: MapId.Route15Gate, 59: MapId.Route14 },
    9: { 0: MapId.FuchsiaCity, 7: MapId.Route15Gate, 14: MapId.Route15Gate, 59: MapId.Route14 },
    10: { 59: MapId.Route14 },
    11: { 59: MapId.Route14 },
    12: { 59: MapId.Route14 },
    13: { 59: MapId.Route14 },
    15: { 0: MapId.FuchsiaCity, 59: MapId.Route14 },
    16: { 0: MapId.FuchsiaCity, 59: MapId.Route14 },
    17: { 0: MapId.FuchsiaCity, 59: MapId.Route14 },
  },
  exits: {

  },
  music: "/game/music/maps-original/route-11.mp3",
  grass: {},
  minimapPos: { x: 138, y: 151 },
};

export default route15;
