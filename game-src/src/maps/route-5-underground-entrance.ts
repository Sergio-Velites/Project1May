import image from "../assets/map/route-5-underground-entrance.png";
import { MapId, MapType } from "./map-types";

const route5UndergroundEntrance: MapType = {
  name: "Entrada Camino Subterráneo (Ruta 5)",
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
    7: [0, 7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.Route5,
  exitReturnPos: { x: 17, y: 28 },
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
  fences: {},
  teleports: {
    4: {
      4: { map: MapId.UndergroundPathNS, pos: { x: 4, y: 3 } },
    },
    8: {
      3: { map: MapId.Route5, pos: { x: 17, y: 28 } },
      4: { map: MapId.Route5, pos: { x: 17, y: 28 } },
    },
  },
  trainers: [],
};

export default route5UndergroundEntrance;
