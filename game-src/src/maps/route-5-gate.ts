import image from "../assets/map/route-5-gate.png";
import { MapId, MapType } from "./map-types";

const route5Gate: MapType = {
  name: "Puerta de Azafrán (Ruta 5)",
  image,
  height: 6,
  width: 8,
  start: { x: 3, y: 4 },
  walls: {
    0: [0, 1, 6, 7],
    1: [0, 1, 6, 7],
    2: [0, 1, 6, 7],
    3: [0, 1, 6, 7],
    4: [0, 1, 6, 7],
    5: [0, 1, 6, 7]
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.Route5,
  exitReturnPos: { x: 10, y: 34 },
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
  fences: {},
  teleports: {
    "-1": {
      2: { map: MapId.Route5, pos: { x: 10, y: 29 } },
      3: { map: MapId.Route5, pos: { x: 10, y: 29 } },
      4: { map: MapId.Route5, pos: { x: 10, y: 29 } },
      5: { map: MapId.Route5, pos: { x: 10, y: 29 } },
    },
    6: {
      2: { map: MapId.Route5, pos: { x: 10, y: 34 } },
      3: { map: MapId.Route5, pos: { x: 10, y: 34 } },
      4: { map: MapId.Route5, pos: { x: 10, y: 34 } },
      5: { map: MapId.Route5, pos: { x: 10, y: 34 } },
    },
  },
  trainers: [],
};

export default route5Gate;
