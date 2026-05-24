import image from "../assets/map/saffron-city-pokemon-center.png";
import { MapType } from "./map-types";

const saffronCityPokemonCenter: MapType = {
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

export default saffronCityPokemonCenter;
