import image from "../assets/map/route-5-day-care.png";
import { MapId, MapType } from "./map-types";

const route5DayCare: MapType = {
  name: "Guardería Pokémon",
  image,
  height: 8,
  width: 8,
  start: { x: 2, y: 3 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    3: [2, 3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.Route5,
  exitReturnPos: { x: 10, y: 22 },
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.Route5, pos: { x: 10, y: 22 } },
      3: { map: MapId.Route5, pos: { x: 10, y: 22 } },
    },
  },
  trainers: [],
  dayCareNpc: { x: 2, y: 3 },
};

export default route5DayCare;
