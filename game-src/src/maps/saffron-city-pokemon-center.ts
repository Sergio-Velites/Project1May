import image from "../assets/map/saffron-city-pokemon-center.png";
import { MapId, MapType } from "./map-types";

const saffronCityPokemonCenter: MapType = {
  name: "Centro Pokemon",
  image,
  height: 8,
  width: 14,
  start: { x: 7, y: 5 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13],
    1: [0, 1, 2, 5, 6, 7],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13],
    3: [13],
    4: [0],
    5: [0],
    6: [0, 1, 6, 7, 12, 13],
    7: [0, 1, 6, 7, 12, 13],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [3, 4],
  },
  exitReturnMap: MapId.SaffronCity,
  exitReturnPos: { x: 9, y: 30 },
  music: "/game/music/maps-original/pokemon-center.mp3",
  grass: {},
  minimapPos: { x: 147, y: 76 },
};

export default saffronCityPokemonCenter;
