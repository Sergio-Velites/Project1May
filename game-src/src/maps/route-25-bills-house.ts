import image from "../assets/map/route-25-bills-house.png";
import { MapId, MapType } from "./map-types";

const route25BillsHouse: MapType = {
  name: "Casa de Bill",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 2, 3, 4, 5, 6, 7],
    2: [0, 2, 3],
    4: [1, 2, 7],
    5: [1, 2, 7],
    6: [5],
    7: [7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.Route25,
  exitReturnPos: { x: 45, y: 4 },
  music: "/game/music/maps-original/route-24-welcome.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.Route25, pos: { x: 45, y: 4 } },
      3: { map: MapId.Route25, pos: { x: 45, y: 4 } },
    },
  },
  trainers: [],
  gifts: [
    {
      pokemonId: 158,
      level: 5,
      pos: { x: 5, y: 3 },
      questId: "route-25-bills-house-gift-5-3",
    },
  ],
};

export default route25BillsHouse;
