import image from "../assets/map/vermilion-city-old-rod-house.png";
import { MapId, MapType } from "./map-types";

const vermilionCityOldRodHouse: MapType = {
  name: "Casa de la Caña Vieja",
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
  exitReturnMap: MapId.VermilionCity,
  exitReturnPos: { x: 15, y: 14 },
  music: "/game/music/maps-original/vermilion-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.VermilionCity, pos: { x: 15, y: 14 } },
      3: { map: MapId.VermilionCity, pos: { x: 15, y: 14 } },
    },
  },
  trainers: [],
};

export default vermilionCityOldRodHouse;
