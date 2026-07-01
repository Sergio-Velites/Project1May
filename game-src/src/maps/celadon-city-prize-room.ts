import image from "../assets/map/celadon-city-prize-room.png";
import { MapType } from "./map-types";

const celadonCityPrizeRoom: MapType = {
  name: "Sala de Premios",
  image,
  height: 8,
  width: 10,
  start: { x: 9, y: 5 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    6: [0, 1, 2, 3, 6, 7, 8, 9],
    7: [0, 1, 2, 3, 6, 7, 8, 9],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [4, 5],
  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 111, y: 76 },
};

export default celadonCityPrizeRoom;
