import image from "../assets/map/saffron-city-fighting-dojo.png";
import { MapType } from "./map-types";

const saffronCityFightingDojo: MapType = {
  name: "Dojo de Lucha",
  image,
  height: 12,
  width: 10,
  start: { x: 8, y: 10 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 3, 6, 9],
    2: [0, 3, 6, 9],
    3: [0, 3, 6, 9],
    4: [0, 9],
    5: [0, 9],
    6: [0, 9],
    7: [0, 9],
    8: [0, 3, 6, 9],
    9: [0, 3, 6, 9],
    10: [0, 9],
    11: [0, 1, 2, 3, 6, 7, 8, 9],
  },
  text: {},
  maps: {

  },
  exits: {
    11: [4, 5],
  },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 147, y: 76 },
};

export default saffronCityFightingDojo;
