import image from "../assets/map/cerulean-city-gym.png";
import { MapType } from "./map-types";

const ceruleanCityGym: MapType = {
  name: "Gimnasio Ciudad Celeste",
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

export default ceruleanCityGym;
