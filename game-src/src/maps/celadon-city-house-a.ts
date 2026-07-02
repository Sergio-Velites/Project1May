import image from "../assets/map/celadon-city-house-a.png";
import { MapId, MapType } from "./map-types";

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
  exitReturnMap: MapId.CeladonCity,
  exitReturnPos: { x: 35, y: 28 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 111, y: 76 },
};

export default celadonCityHouseA;
