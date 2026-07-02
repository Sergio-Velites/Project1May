import image from "../assets/map/vermilion-city-gym.png";
import { MapId, MapType } from "./map-types";

const vermilionCityGym: MapType = {
  name: "Gimnasio Ciudad Carmin",
  image,
  height: 18,
  width: 10,
  start: { x: 9, y: 16 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 1, 6, 7, 8, 9],
    2: [0, 1, 8, 9],
    3: [0, 1, 8, 9],
    4: [0, 1, 2, 3, 6, 7, 8, 9],
    5: [0, 1, 2, 3, 6, 7, 8, 9],
    7: [1, 3, 5, 7, 9],
    9: [1, 3, 5, 7, 9],
    11: [1, 3, 5, 7, 9],
    13: [3, 6],
    14: [3, 6],
  },
  text: {},
  maps: {

  },
  exits: {
    17: [4, 5],
  },
  exitReturnMap: MapId.VermilionCity,
  exitReturnPos: { x: 12, y: 20 },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 147, y: 123 },
};

export default vermilionCityGym;
