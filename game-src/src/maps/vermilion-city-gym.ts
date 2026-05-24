import image from "../assets/map/vermilion-city-gym.png";
import { MapType } from "./map-types";

const vermilionCityGym: MapType = {
  name: "Gimnasio Ciudad Carmin",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
};

export default vermilionCityGym;
