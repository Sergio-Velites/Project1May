import image from "../assets/map/route-16-fly-house.png";
import { MapId, MapType } from "./map-types";

const route16FlyHouse: MapType = {
  name: "Casa de la MO Vuelo",
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
  exitReturnMap: MapId.Route16,
  exitReturnPos: { x: 7, y: 6 },
  music: "/game/music/maps-original/bicycle.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.Route16, pos: { x: 7, y: 6 } },
      3: { map: MapId.Route16, pos: { x: 7, y: 6 } },
    },
  },
  trainers: [],
};

export default route16FlyHouse;
