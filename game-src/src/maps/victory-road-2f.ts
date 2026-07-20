import image from "../assets/map/victory-road-2f.png";
import { MapId, MapType } from "./map-types";

const victoryRoad2f: MapType = {
  name: "Camino Victoria 2F",
  image,
  height: 18,
  width: 30,
  start: { x: 20, y: 17 },
  walls: {
    0: [0, 1, 14, 29],
    1: [0, 14, 29],
    2: [0, 5, 14, 29],
    3: [0, 14, 29],
    4: [0, 1, 2, 3, 4, 6, 7, 8, 14, 18, 19, 20, 21, 22, 23, 24, 29],
    5: [0, 6, 8, 14, 24, 29],
    6: [8, 14, 24, 25, 26, 27, 28, 29],
    7: [8, 14, 24, 26],
    8: [1, 4, 7, 15, 24],
    9: [4, 7, 15, 24, 29],
    10: [0, 4, 6, 7, 8, 9, 10, 11, 12, 15, 24, 25, 26, 27, 28, 29],
    11: [0, 8, 12, 15],
    12: [0, 1, 8, 12, 22, 27],
    13: [0, 1, 8, 12, 22, 27],
    14: [0, 8, 12, 23, 27],
    15: [0, 2, 8, 12, 13, 14, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26, 27],
    16: [0, 5, 6, 7, 8],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  text: {},
  maps: {},
  teleports: {
    1: {
      1: { map: MapId.VictoryRoad3f, pos: { x: 2, y: 1 } },
    },
    7: {
      23: { map: MapId.VictoryRoad3f, pos: { x: 23, y: 8 } },
      27: { map: MapId.VictoryRoad3f, pos: { x: 26, y: 9 } },
      30: { map: MapId.LeagueRoute, pos: { x: 15, y: 50 } },
    },
    8: {
      0: { map: MapId.VictoryRoad1f, pos: { x: 2, y: 1 } },
      30: { map: MapId.LeagueRoute, pos: { x: 15, y: 50 } },
    },
    14: {
      25: { map: MapId.VictoryRoad3f, pos: { x: 27, y: 16 } },
    },
  },
  exits: {},
  exitReturnMap: MapId.Route23,
  exitReturnPos: { x: 14, y: 32 },
  music: "/game/music/maps-original/victory-road.mp3",
  grass: {},
  minimapPos: { x: 29, y: 65 },
  fences: {},
  trainers: [],
};

export default victoryRoad2f;
