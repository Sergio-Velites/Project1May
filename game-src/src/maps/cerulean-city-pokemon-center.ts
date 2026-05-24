import image from "../assets/map/cerulean-city-pokemon-center.png";
import { MapType } from "./map-types";

const ceruleanCityPokemonCenter: MapType = {
  name: "Centro Pokemon",
  image,
  height: 8,
  width: 14,
  start: { x: 7, y: 6 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-center.mp3",
  grass: {},
};

export default ceruleanCityPokemonCenter;
