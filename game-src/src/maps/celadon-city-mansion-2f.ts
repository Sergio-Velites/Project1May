import image from "../assets/map/celadon-city-mansion-2f.png";
import { MapId, MapType } from "./map-types";

const celadonCityMansion2f: MapType = {
  name: "Mansión Celadon 2F",
  image,
  height: 12,
  width: 8,
  start: { x: 2, y: 2 },
  walls: {
    0: [0, 1, 3, 4, 5, 6],
    1: [0, 1, 3, 4, 5, 6],
    2: [0, 1, 2, 3, 4, 5],
    3: [0, 1, 2, 3, 4, 5],
    5: [0, 1, 5],
    6: [0, 3, 4, 5],
    7: [0, 3, 4, 5],
    8: [0, 5],
    9: [0, 1, 2, 3, 5, 6, 7]
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeladonCity,
  exitReturnPos: { x: 24, y: 10 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    1: {
      2: { map: MapId.CeladonCityMansion1f, pos: { x: 2, y: 2 } },
      7: { map: MapId.CeladonCityMansion3f, pos: { x: 7, y: 2 } },
    },
  },
  trainers: [],
};

export default celadonCityMansion2f;
