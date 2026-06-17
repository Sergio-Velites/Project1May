import image from "../assets/map/celadon-city-house-b.png";
import { MapType } from "./map-types";

const celadonCityHouseB: MapType = {
  name: "Casa Ciudad Celedon",
  image,
  height: 8,
  width: 10,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [6],
    2: [0, 1, 6],
    3: [0, 1, 6],
    4: [6],
    5: [0, 1, 6],
    6: [0, 1, 6, 7, 8, 9],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [3, 4],
  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCityHouseB;
