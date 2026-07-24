import image from "../assets/map/celadon-city-mansion-1f.png";
import { MapId, MapType } from "./map-types";

const celadonCityMansion1f: MapType = {
  name: "Mansión Celadon 1F",
  image,
  height: 12,
  width: 8,
  start: { x: 4, y: 10 },
  walls: {
    0: [0, 1, 3, 4, 5, 6],
    1: [0, 1, 3, 4, 5, 6],
    2: [5],
    3: [0, 1, 2, 3, 5],
    4: [5],
    5: [0, 1, 4, 5],
    6: [0, 1, 5],
    7: [0, 1, 5],
    8: [0, 1, 2, 5],
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
      2: { map: MapId.CeladonCityMansion2f, pos: { x: 2, y: 2 } },
      7: { map: MapId.CeladonCityMansion2f, pos: { x: 7, y: 2 } },
    },
    11: {
      4: { map: MapId.CeladonCity, pos: { x: 24, y: 10 } },
      5: { map: MapId.CeladonCity, pos: { x: 24, y: 10 } },
    },
  },
  trainers: [],
};

export default celadonCityMansion1f;
