import image from "../assets/map/vermilion-city-poke-mart.png";
import { MapType } from "./map-types";

const vermilionCityPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/vermilion-city.mp3",
  grass: {},
};

export default vermilionCityPokeMart;
