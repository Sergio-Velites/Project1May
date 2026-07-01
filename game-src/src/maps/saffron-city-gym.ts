import image from "../assets/map/saffron-city-gym.png";
import { MapId, MapType } from "./map-types";

const saffronCityGym: MapType = {
  name: "Gimnasio Ciudad Azafran",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 5 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [6, 13],
    2: [6, 13],
    3: [6, 13],
    4: [6, 13],
    5: [6, 13],
    6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    7: [6, 13],
    8: [6, 13],
    9: [6, 13],
    10: [6, 13],
    11: [6, 13],
    12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    13: [6, 13],
    14: [6, 9, 13],
    15: [6, 9, 13],
    16: [6, 13],
    17: [6, 13],
  },
  text: {},
  maps: {
    3: { 1: MapId.SaffronCityGym, 5: MapId.SaffronCityGym, 9: MapId.SaffronCityGym, 11: MapId.SaffronCityGym, 15: MapId.SaffronCityGym, 19: MapId.SaffronCityGym },
    5: { 1: MapId.SaffronCityGym, 5: MapId.SaffronCityGym, 9: MapId.SaffronCityGym, 11: MapId.SaffronCityGym, 15: MapId.SaffronCityGym, 19: MapId.SaffronCityGym },
    9: { 1: MapId.SaffronCityGym, 5: MapId.SaffronCityGym, 15: MapId.SaffronCityGym, 19: MapId.SaffronCityGym },
    11: { 1: MapId.SaffronCityGym, 5: MapId.SaffronCityGym, 11: MapId.SaffronCityGym, 15: MapId.SaffronCityGym, 19: MapId.SaffronCityGym },
    15: { 1: MapId.SaffronCityGym, 5: MapId.SaffronCityGym, 11: MapId.SaffronCityGym, 15: MapId.SaffronCityGym, 19: MapId.SaffronCityGym },
    17: { 1: MapId.SaffronCityGym, 5: MapId.SaffronCityGym, 15: MapId.SaffronCityGym, 19: MapId.SaffronCityGym },
  },
  exits: {
    17: [8, 9],
  },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 147, y: 76 },
};

export default saffronCityGym;
