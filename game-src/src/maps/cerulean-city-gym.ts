import image from "../assets/map/cerulean-city-gym.png";
import { MapId, MapType } from "./map-types";

const ceruleanCityGym: MapType = {
  name: "Gimnasio Ciudad Celeste",
  image,
  height: 14,
  width: 10,
  start: { x: 9, y: 13 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [4, 5],
    2: [1, 2, 3, 6, 7, 8],
    3: [1, 8],
    4: [1, 2, 3, 4, 5, 6, 8],
    5: [1, 8],
    6: [1, 3, 4, 6, 7, 8],
    7: [1, 3, 4, 6, 7, 8],
    8: [1, 6, 7, 8],
    9: [1, 2, 3, 6, 7, 8],
    10: [1, 2, 3, 6, 8],
    11: [1, 2, 3, 6, 8],
  },
  text: {},
  maps: {

  },
  exits: {
    13: [4, 5],
  },
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 30, y: 20 },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
};

export default ceruleanCityGym;
