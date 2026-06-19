import image from "../assets/map/route-6.png";
import { Direction } from "../state/state-types";import { MapType } from "./map-types";

const route6: MapType = {
  name: "Ruta 6",
  image,
  height: 36,
  width: 20,
  start: { x: 9, y: 35 },
  walls: {
    0: [9, 11],
    1: [11],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    3: [8, 9, 10, 11, 12, 13],
    4: [8, 9, 10, 11, 12, 13],
    5: [8, 9, 10, 11, 12, 13],
    6: [8, 9, 10, 11, 12, 13],
    7: [8, 9, 11, 12, 13],
    10: [16, 17, 18, 19],
    11: [16, 17, 18, 19],
    12: [16, 17, 18, 19],
    13: [16, 18, 19],
    15: [19],
    24: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    25: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    26: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    27: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    28: [0, 1, 2, 3],
    29: [3],
    30: [3],
    31: [3, 4, 5, 6, 7],
    32: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    33: [0, 1, 2, 3, 4, 5, 6, 7, 10],
    34: [0, 1, 2, 3, 4, 5, 6, 7, 10],
    35: [0, 1, 2, 3, 4, 5, 6, 7, 10],
  },
  fenceDirections: {
    7: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 18: Direction.Down, 19: Direction.Down },
    11: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 8: Direction.Down, 9: Direction.Down, 10: Direction.Down, 11: Direction.Down, 12: Direction.Down, 13: Direction.Down, 14: Direction.Down, 15: Direction.Down },
  },
  fences: {
    7: [0, 1, 2, 4, 5, 6, 7, 14, 15, 16, 18, 19],
    11: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  text: {},
  maps: {
    0: { 0: MapId.SaffronCity, 1: MapId.SaffronCity, 2: MapId.SaffronCity, 3: MapId.SaffronCity, 4: MapId.SaffronCity, 5: MapId.SaffronCity, 6: MapId.SaffronCity, 7: MapId.SaffronCity, 8: MapId.SaffronCity, 10: MapId.SaffronCity, 12: MapId.SaffronCity, 13: MapId.SaffronCity, 14: MapId.SaffronCity, 15: MapId.SaffronCity, 16: MapId.SaffronCity, 17: MapId.SaffronCity, 18: MapId.SaffronCity, 19: MapId.SaffronCity },
    35: { 8: MapId.VermilionCity, 9: MapId.VermilionCity, 11: MapId.VermilionCity, 12: MapId.VermilionCity, 13: MapId.VermilionCity, 14: MapId.VermilionCity, 15: MapId.VermilionCity, 16: MapId.VermilionCity, 17: MapId.VermilionCity, 18: MapId.VermilionCity, 19: MapId.VermilionCity },
  },
  exits: {

  },
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
  minimapPos: { x: 147, y: 100 },
};

export default route6;
