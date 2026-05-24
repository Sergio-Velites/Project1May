import image from "../assets/map/saffron-city-fighting-dojo.png";
import { MapType } from "./map-types";

const saffronCityFightingDojo: MapType = {
  name: "Dojo de Lucha",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
};

export default saffronCityFightingDojo;
