import image from "../assets/map/cerulean-city-house-a.png";
import { MapId, MapType } from "./map-types";

const ceruleanCityHouseA: MapType = {
  name: "Casa Ciudad Celeste",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 13, y: 16 },
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.CeruleanCity, pos: { x: 13, y: 16 } },
      3: { map: MapId.CeruleanCity, pos: { x: 13, y: 16 } },
    },
  },
  trainers: [],
};

export default ceruleanCityHouseA;
