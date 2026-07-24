import image from "../assets/map/ss-anne-kitchen.png";
import { MapId, MapType } from "./map-types";

const ssAnneKitchen: MapType = {
  name: "Cocina del S.S. Anne",
  image,
  height: 16,
  width: 14,
  start: { x: 6, y: 1 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13],
    5: [2, 3, 6, 7, 10, 11],
    6: [2, 3, 6, 7, 10, 11],
    7: [2, 3, 6, 7, 10, 11],
    8: [0, 2, 3, 4, 6, 7, 8, 10, 11],
    9: [2, 3, 6, 7, 10, 11],
    10: [2, 3, 6, 7, 10, 11],
    13: [11],
    14: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.SsAnne1f,
  exitReturnPos: { x: 31, y: 7 },
  music: "/game/music/maps-original/ss-anne.mp3",
  grass: {},
  fences: {},
  teleports: {
    0: {
      6: { map: MapId.SsAnne1f, pos: { x: 31, y: 7 } },
    },
  },
  trainers: [],
};

export default ssAnneKitchen;
