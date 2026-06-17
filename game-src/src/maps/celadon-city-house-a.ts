import image from "../assets/map/celadon-city-npc-a.png";
import { MapType } from "./map-types";

const celadonCityHouseA: MapType = {
  name: "Casa Ciudad Celedon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [2, 3, 4, 5],
    3: [2, 3, 4, 5],
    4: [2, 3, 4, 5],
    6: [0, 1, 6, 7],
    7: [0, 1, 6, 7],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCityHouseA;
