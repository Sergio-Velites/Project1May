import image from "../assets/map/celadon-city-game-corner.png";
import { MapType } from "./map-types";

const celadonCityPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCityPokeMart;
