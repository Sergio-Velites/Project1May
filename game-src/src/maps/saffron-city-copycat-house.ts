import image from "../assets/map/saffron-city-copycat-house.png";
import { MapId, MapType } from "./map-types";

const saffronCityCopycatHouse: MapType = {
  name: "Casa Mimica",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 3],
    4: [3, 4],
    5: [3, 4],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  exitReturnMap: MapId.SaffronCity,
  exitReturnPos: { x: 7, y: 6 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 147, y: 76 },
};

export default saffronCityCopycatHouse;
