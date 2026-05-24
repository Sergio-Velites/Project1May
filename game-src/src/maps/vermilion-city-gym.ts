import image from "../assets/map/vermilion-city-gym.png";
import { MapType } from "./map-types";

const vermilionCityGym: MapType = {
  name: "Gimnasio Ciudad Carmin",
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

export default vermilionCityGym;
