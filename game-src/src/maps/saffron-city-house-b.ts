import image from "../assets/map/saffron-city-house-b.png";
import { MapId, MapType } from "./map-types";

const saffronCityHouseB: MapType = {
  name: "Casa Ciudad Azafran",
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
  exitReturnMap: MapId.SaffronCity,
  exitReturnPos: { x: 13, y: 12 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 148, y: 76 },
};

export default saffronCityHouseB;
