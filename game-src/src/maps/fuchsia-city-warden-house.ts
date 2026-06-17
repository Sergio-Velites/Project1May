import image from "../assets/map/fuchsia-city-warden.png";
import { MapType } from "./map-types";

const fuchsiaCityWardenHouse: MapType = {
  name: "Casa del Guarda",
  image,
  height: 8,
  width: 10,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    2: [0, 1, 4, 5, 7, 8, 9],
    3: [4, 5, 7, 9],
    6: [0, 9],
    7: [0, 9],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [4, 5],
  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default fuchsiaCityWardenHouse;
