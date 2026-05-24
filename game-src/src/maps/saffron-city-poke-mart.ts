import image from "../assets/map/saffron-city-poke-mart.png";
import { MapType } from "./map-types";

const saffronCityPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default saffronCityPokeMart;
