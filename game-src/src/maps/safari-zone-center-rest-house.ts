import image from "../assets/map/safari-zone-center-rest-house.png";
import { MapId, MapType } from "./map-types";

const safariZoneCenterRestHouse: MapType = {
  name: "Refugio Safari (Centro)",
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
  exitReturnMap: MapId.SafariZoneCenter,
  exitReturnPos: { x: 17, y: 20 },
  music: "/game/music/maps-original/safari-zone.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.SafariZoneCenter, pos: { x: 17, y: 20 } },
      3: { map: MapId.SafariZoneCenter, pos: { x: 17, y: 20 } },
    },
  },
  trainers: [],
};

export default safariZoneCenterRestHouse;
