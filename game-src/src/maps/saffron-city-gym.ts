import image from "../assets/map/saffron-city-gym.png";
import { MapType } from "./map-types";

const saffronCityGym: MapType = {
  name: "Gimnasio Ciudad Azafran",
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

export default saffronCityGym;
