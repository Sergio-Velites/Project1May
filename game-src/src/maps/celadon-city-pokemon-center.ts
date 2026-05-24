import image from "../assets/map/celadon-city-pokemon-center.png";
import { MapType } from "./map-types";

const celadonCityPokemonCenter: MapType = {
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

export default celadonCityPokemonCenter;
