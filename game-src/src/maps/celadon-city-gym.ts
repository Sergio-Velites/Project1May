import image from "../assets/map/celadon-city-gym.png";
import { MapType } from "./map-types";

const celadonCityGym: MapType = {
  name: "Gimnasio Ciudad Celedon",
  image,
  height: 18,
  width: 10,
  start: { x: 9, y: 16 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    2: [2, 3, 4, 5, 6, 7],
    3: [2, 7],
    4: [2, 7],
    5: [2, 7],
    6: [2, 7],
    7: [2, 3, 4, 5, 6, 7],
    8: [2, 3, 6, 7],
    9: [2, 3, 6, 7],
    10: [9],
    11: [0],
    12: [2, 3, 6, 7],
    13: [2, 3, 6, 7],
    14: [3, 6],
    15: [3, 6],
  },
  text: {},
  maps: {

  },
  exits: {
    17: [4, 5],
  },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 118, y: 93 },
};

export default celadonCityGym;
