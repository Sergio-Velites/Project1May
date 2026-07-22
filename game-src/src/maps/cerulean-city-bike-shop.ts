import image from "../assets/map/cerulean-city-bike-shop.png";
import { MapId, MapType } from "./map-types";

const ceruleanCityBikeShop: MapType = {
  name: "Ciclo Club",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 2, 3, 5],
    2: [0, 1, 2, 3, 5],
    3: [5, 6, 7],
    4: [0, 1],
    5: [0, 1],
    6: [6],
    7: [7],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 13, y: 26 },
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
};

export default ceruleanCityBikeShop;
