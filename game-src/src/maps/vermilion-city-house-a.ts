import image from "../assets/map/vermilion-city-house-a.png";
import { MapType } from "./map-types";

const vermilionCityHouseA: MapType = {
  name: "Casa Ciudad Carmin",
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
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  music: "/game/music/maps-original/vermilion-city.mp3",
  grass: {},
  minimapPos: { x: 147, y: 123 },
};

export default vermilionCityHouseA;
