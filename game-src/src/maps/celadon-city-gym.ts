import image from "../assets/map/celadon-city-gym.png";
import { MapType } from "./map-types";

const celadonCityGym: MapType = {
  name: "Gimnasio Ciudad Celedon",
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

export default celadonCityGym;
