import image from "../assets/map/route-25.png";
import { Direction } from "../state/state-types";import { MapId, MapType } from "./map-types";

const route25: MapType = {
  name: "Ruta 25",
  image,
  height: 18,
  width: 60,
  start: { x: 21, y: 11 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 44, 45, 46, 47],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 21, 27, 37, 44, 45, 46, 47, 56, 57, 58, 59],
    3: [11, 15, 21, 26, 27, 37, 38, 39, 40, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    4: [21, 22, 23, 25, 31, 55, 56, 57, 58, 59],
    5: [12, 14, 16, 21, 25, 31, 55, 56, 57, 58, 59],
    6: [10, 11, 16, 18, 19, 21, 55, 56, 57, 58, 59],
    7: [8, 12, 16, 21, 28, 29, 55, 56, 57, 58, 59],
    8: [10, 12, 13, 16, 28, 38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 55, 56, 57, 58, 59],
    9: [10, 16, 18, 28, 38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 55, 56, 57, 58, 59],
    10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 55, 56, 57, 58, 59],
    11: [38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 55, 56, 57, 58, 59],
    12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 55, 56, 57, 58, 59],
    13: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    14: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    16: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  },
  fenceDirections: {
    0: { 48: Direction.Left },
    1: { 10: Direction.Down, 11: Direction.Down, 12: Direction.Down, 13: Direction.Down, 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 35: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down, 40: Direction.Down, 41: Direction.Down, 42: Direction.Down, 43: Direction.Down, 48: Direction.Down, 49: Direction.Down, 50: Direction.Down, 51: Direction.Down, 52: Direction.Down, 53: Direction.Down, 54: Direction.Down, 55: Direction.Down, 56: Direction.Down, 57: Direction.Down, 58: Direction.Down, 59: Direction.Down },
    3: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down },
    7: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down },
  },
  fences: {
    0: [48],
    1: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    7: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  text: {},
  maps: {
    3: { 0: MapId.Route24 },
    4: { 0: MapId.Route24 },
    5: { 0: MapId.Route24 },
    6: { 0: MapId.Route24 },
    7: { 0: MapId.Route24 },
    8: { 0: MapId.Route24 },
    9: { 0: MapId.Route24 },
    11: { 0: MapId.Route24 },
  },
  exits: {

  },
  music: "/game/music/maps-original/route-24-welcome.mp3",
  grass: {},
  minimapPos: { x: 163, y: 14 },
};

export default route25;
