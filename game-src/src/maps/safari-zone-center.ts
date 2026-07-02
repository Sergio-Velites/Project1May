import image from "../assets/map/safari-zone-center.png";
import { MapId, MapType } from "./map-types";

const safariZoneCenter: MapType = {
  name: "Zona Safari - Centro",
  image,
  height: 26,
  width: 30,
  start: { x: 20, y: 24 },
  walls: {
    0: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    1: [1, 10, 11, 28],
    2: [0, 11, 29],
    3: [0, 11, 29],
    4: [0, 11, 29],
    5: [0, 11, 29],
    6: [0, 11, 29],
    7: [0, 11, 29],
    8: [0, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 28, 29],
    9: [0, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    10: [8, 9, 10, 11, 18, 19, 20, 21],
    11: [8, 9, 10, 11, 18, 19, 20, 21],
    12: [0, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 29],
    13: [0, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 29],
    14: [0, 10, 13, 16, 19, 29],
    15: [0, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 29],
    16: [0, 1, 2, 3, 4, 5, 29],
    17: [0, 1, 29],
    18: [0, 16, 17, 18, 19, 29],
    19: [0, 16, 18, 19, 29],
    20: [0, 18, 29],
    21: [0, 29],
    22: [0, 14, 29],
    23: [0, 29],
    24: [1, 2, 7, 13, 16, 22, 27, 28],
    25: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
  },
  text: {},
  maps: {
    0: { 14: MapId.SafariZoneArea2, 15: MapId.SafariZoneArea2 },
    10: { 0: MapId.SafariZoneArea3, 29: MapId.SafariZoneArea1 },
    11: { 0: MapId.SafariZoneArea3, 29: MapId.SafariZoneArea1 },
  },
  teleports: {
    // Hueco sur (cols 14-15) → puerta del edificio Safari en Ciudad Fucsia
    25: {
      14: { map: MapId.FuchsiaCity, pos: { x: 18, y: 4 } },
      15: { map: MapId.FuchsiaCity, pos: { x: 18, y: 4 } },
    },
  },
  exits: {

  },
  music: "/game/music/maps-original/safari-zone.mp3",
  grass: {},
  minimapPos: { x: 124, y: 162 },
};

export default safariZoneCenter;
