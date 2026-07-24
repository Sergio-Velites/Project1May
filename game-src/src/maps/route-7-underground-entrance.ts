import image from "../assets/map/route-7-underground-entrance.png";
import { MapId, MapType } from "./map-types";

const route7UndergroundEntrance: MapType = {
  name: "Entrada Camino Subterráneo (Ruta 7)",
  image,
  height: 8,
  width: 8,
  start: { x: 3, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 6, 7],
    2: [0, 1, 6, 7],
    3: [0, 1, 6, 7],
    4: [0, 1, 6, 7],
    5: [0, 1, 6, 7],
    6: [0, 1, 6, 7],
    7: [0, 7]
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.Route7,
  exitReturnPos: { x: 5, y: 14 },
  music: "/game/music/maps-original/route-11.mp3",
  grass: {},
  fences: {},
  teleports: {
    4: {
      3: { map: MapId.UndergroundPathEW, pos: { x: 3, y: 5 } },
    },
    8: {
      3: { map: MapId.Route7, pos: { x: 5, y: 14 } },
      4: { map: MapId.Route7, pos: { x: 5, y: 14 } },
    },
  },
  trainers: [],
};

export default route7UndergroundEntrance;
