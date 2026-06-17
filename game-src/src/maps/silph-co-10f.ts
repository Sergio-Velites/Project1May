import image from "../assets/map/silph-co-10f.png";
import { MapType } from "./map-types";

const silphCo10f: MapType = {
  name: "Silph S.A. 10F",
  image,
  height: 18,
  width: 16,
  start: { x: 14, y: 16 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 9, 11, 13, 14, 15],
    1: [0, 15],
    2: [0, 15],
    3: [0, 15],
    4: [0, 7, 8, 9, 12, 13, 14, 15],
    5: [0, 7, 15],
    6: [0, 7, 8, 15],
    7: [0, 7, 8, 15],
    8: [0, 1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15],
    9: [0, 7, 15],
    10: [0, 2, 3, 4, 5, 7, 12, 13, 15],
    11: [0, 2, 3, 4, 7, 12, 13, 15],
    12: [0, 3, 4, 5, 7, 10, 11, 12, 13, 15],
    13: [0, 2, 3, 4, 5, 7, 10, 11, 15],
    14: [0, 2, 5, 7, 10, 11, 15],
    15: [0, 4, 5, 7, 15],
    16: [0, 7, 15],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  text: {},
  maps: {
    0: { 8: MapId.SilphCo9f, 10: MapId.SilphCo11f },
    7: { 13: MapId.SilphCo4f },
    11: { 9: MapId.SilphCo4f },
    15: { 13: MapId.SilphCo4f },
  },
  exits: {

  },
  music: "/game/music/maps-original/silph-co.mp3",
  grass: {},
  minimapPos: { x: 162, y: 93 },
};

export default silphCo10f;
