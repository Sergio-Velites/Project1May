import image from "../assets/map/safari-zone-area-3-rest-house-b.png";
import { MapId, MapType } from "./map-types";

const safariZoneArea3RestHouseB: MapType = {
  name: "Refugio Safari (Área 3 Sur)",
  image,
  height: 8,
  width: 8,
  start: { x: 3, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [1, 3],
    3: [1, 3],
    4: [5, 6, 7],
    5: [1, 3, 5],
    6: [5],
    7: [5]
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.SafariZoneArea3,
  exitReturnPos: { x: 11, y: 12 },
  music: "/game/music/maps-original/safari-zone.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.SafariZoneArea3, pos: { x: 11, y: 12 } },
      3: { map: MapId.SafariZoneArea3, pos: { x: 11, y: 12 } },
    },
  },
  trainers: [],
};

export default safariZoneArea3RestHouseB;
