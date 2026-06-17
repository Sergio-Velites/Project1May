import image from "../assets/map/celadon-city-poke-mart.png";
import { MapType } from "./map-types";

const celadonCityPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {
    1: { 12: MapId.CeladonCityDeptStore2f },
  },
  exits: {},
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 118, y: 93 },
};

export default celadonCityPokeMart;
