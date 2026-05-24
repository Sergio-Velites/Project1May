import image from "../assets/map/cerulean-city-pokemon-center.png";
import { MapType } from "./map-types";

const ceruleanCityPokemonCenter: MapType = {
  name: "Centro Pokemon",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-center.mp3",
  grass: {},
};

export default ceruleanCityPokemonCenter;
