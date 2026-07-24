import image from "../assets/map/fuchsia-city-good-rod-house.png";
import { MapId, MapType } from "./map-types";

const fuchsiaCityGoodRodHouse: MapType = {
  name: "Casa de la Caña Buena",
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
  exitReturnMap: MapId.FuchsiaCity,
  exitReturnPos: { x: 22, y: 14 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.FuchsiaCity, pos: { x: 22, y: 14 } },
      3: { map: MapId.FuchsiaCity, pos: { x: 22, y: 14 } },
    },
  },
  trainers: [],
};

export default fuchsiaCityGoodRodHouse;
