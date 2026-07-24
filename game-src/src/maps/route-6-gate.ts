import image from "../assets/map/route-6-gate.png";
import { MapId, MapType } from "./map-types";

const route6Gate: MapType = {
  name: "Puerta de Azafrán (Ruta 6)",
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
  exitReturnMap: MapId.Route6,
  exitReturnPos: { x: 10, y: 8 },
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
  fences: {},
  teleports: {
    "-1": {
      2: { map: MapId.SaffronCity, pos: { x: 20, y: 34 } },
      3: { map: MapId.SaffronCity, pos: { x: 20, y: 34 } },
      4: { map: MapId.SaffronCity, pos: { x: 20, y: 34 } },
      5: { map: MapId.SaffronCity, pos: { x: 20, y: 34 } },
    },
    6: {
      2: { map: MapId.Route6, pos: { x: 10, y: 8 } },
      3: { map: MapId.Route6, pos: { x: 10, y: 8 } },
      4: { map: MapId.Route6, pos: { x: 10, y: 8 } },
      5: { map: MapId.Route6, pos: { x: 10, y: 8 } },
    },
  },
  trainers: [],
};

export default route6Gate;
