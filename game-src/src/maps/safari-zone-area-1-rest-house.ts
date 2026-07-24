import image from "../assets/map/safari-zone-area-1-rest-house.png";
import { MapId, MapType } from "./map-types";

const safariZoneArea1RestHouse: MapType = {
  name: "Refugio Safari (Área 1)",
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
  exitReturnMap: MapId.SafariZoneArea1,
  exitReturnPos: { x: 25, y: 10 },
  music: "/game/music/maps-original/safari-zone.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.SafariZoneArea1, pos: { x: 25, y: 10 } },
      3: { map: MapId.SafariZoneArea1, pos: { x: 25, y: 10 } },
    },
  },
  trainers: [],
};

export default safariZoneArea1RestHouse;
