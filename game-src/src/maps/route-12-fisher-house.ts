import image from "../assets/map/route-12-fisher-house.png";
import { MapId, MapType } from "./map-types";

const route12FisherHouse: MapType = {
  name: "Casa del Pescador",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.Route12,
  exitReturnPos: { x: 11, y: 78 },
  music: "/game/music/maps-original/route-11.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.Route12, pos: { x: 11, y: 78 } },
      3: { map: MapId.Route12, pos: { x: 11, y: 78 } },
    },
  },
  trainers: [],
};

export default route12FisherHouse;
