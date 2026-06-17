import image from "../assets/map/fuchsia-city-gym.png";
import { MapType } from "./map-types";

const fuchsiaCityGym: MapType = {
  name: "Gimnasio Ciudad Fucsia",
  image,
  height: 18,
  width: 10,
  start: { x: 9, y: 16 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    2: [2, 3, 7],
    3: [4, 5, 7],
    4: [0, 1, 4, 7],
    5: [4, 7],
    6: [0, 2, 3, 6],
    7: [0, 6],
    8: [2, 3, 4, 5, 6],
    9: [6],
    10: [2, 7],
    11: [0, 1, 2, 7],
    12: [2, 3, 4, 5, 6, 7],
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
  minimapPos: { x: 118, y: 140 },
};

export default fuchsiaCityGym;
