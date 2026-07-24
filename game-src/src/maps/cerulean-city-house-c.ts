import image from "../assets/map/cerulean-city-house-c.png";
import { MapId, MapType } from "./map-types";

const ceruleanCityHouseC: MapType = {
  name: "Casa Ciudad Celeste C",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 4, 5, 6, 7],
    1: [0, 1],
    3: [3, 4],
    4: [3, 4],
    6: [0],
    7: [0, 6, 7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 9, y: 12 },
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    0: {
      3: { map: MapId.CeruleanCity, pos: { x: 9, y: 9 } },
    },
    8: {
      2: { map: MapId.CeruleanCity, pos: { x: 9, y: 12 } },
      3: { map: MapId.CeruleanCity, pos: { x: 9, y: 12 } },
    },
  },
  trainers: [],
};

export default ceruleanCityHouseC;
