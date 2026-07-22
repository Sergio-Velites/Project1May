import image from "../assets/map/silph-co-3f.png";
import { MapId, MapType } from "./map-types";

const silphCo3f: MapType = {
  name: "Silph S.A. 3F",
  image,
  height: 18,
  width: 30,
  start: { x: 20, y: 16 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 27, 28, 29],
    1: [0, 29],
    2: [0, 29],
    3: [0, 29],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    5: [0, 1, 2, 3, 4, 5, 9, 10, 11, 14, 15, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    6: [0, 1, 9, 17, 21, 28, 29],
    7: [0, 1, 4, 5, 9, 17, 21, 28, 29],
    8: [0, 4, 5, 12, 13, 26, 27, 29],
    9: [0, 4, 5, 12, 13, 26, 27, 29],
    10: [0, 4, 5, 9, 17, 21, 24, 26, 29],
    11: [0, 9, 17, 21, 24, 26, 29],
    12: [0, 9, 17, 21, 29],
    13: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    14: [0, 29],
    15: [0, 29],
    16: [0, 29],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
  },
  text: {},
  maps: {

  },
  teleports: {
    0: { 24: { map: MapId.SilphCo4f, pos: { x: 24, y: 0 } }, 26: { map: MapId.SilphCo2f, pos: { x: 26, y: 0 } } },
    3: { 3: { map: MapId.SilphCo5f, pos: { x: 11, y: 5 } }, 27: { map: MapId.SilphCo2f, pos: { x: 3, y: 3 } } },
    11: { 3: { map: MapId.SilphCo9f, pos: { x: 9, y: 3 } }, 11: { map: MapId.SilphCo7f, pos: { x: 5, y: 3 } }, 23: { map: MapId.SilphCo3f, pos: { x: 27, y: 15 } } },
    15: { 3: { map: MapId.SilphCo5f, pos: { x: 3, y: 15 } }, 27: { map: MapId.SilphCo3f, pos: { x: 23, y: 11 } } },
  },
  exits: {

  },
  music: "/game/music/maps-original/silph-co.mp3",
  grass: {},
};

export default silphCo3f;
