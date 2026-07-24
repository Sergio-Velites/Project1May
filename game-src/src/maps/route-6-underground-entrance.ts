import image from "../assets/map/route-6-underground-entrance.png";
import { MapId, MapType } from "./map-types";

const route6UndergroundEntrance: MapType = {
  name: "Entrada Camino Subterráneo (Ruta 6)",
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
  exitReturnMap: MapId.Route6,
  exitReturnPos: { x: 17, y: 14 },
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
  fences: {},
  teleports: {
    4: {
      3: { map: MapId.UndergroundPathNS, pos: { x: 3, y: 41 } },
    },
    8: {
      3: { map: MapId.Route6, pos: { x: 17, y: 14 } },
      4: { map: MapId.Route6, pos: { x: 17, y: 14 } },
    },
  },
  trainers: [],
};

export default route6UndergroundEntrance;
