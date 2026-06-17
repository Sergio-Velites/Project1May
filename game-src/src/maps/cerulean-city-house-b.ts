import image from "../assets/map/cerulean-city-house-b.png";
import { MapType } from "./map-types";

const ceruleanCityHouseB: MapType = {
  name: "Casa Ciudad Celeste",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 4, 5, 6, 7],
    1: [0, 1],
    3: [3, 4],
    4: [3, 4],
    6: [0],
    7: [0, 6, 7],
  },
  text: {},
  maps: {

  },
  exits: {
    0: [3],
    7: [2, 3],
  },
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
};

export default ceruleanCityHouseB;
