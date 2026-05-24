import image from "../assets/map/fuchsia-city-gym.png";
import { MapType } from "./map-types";

const fuchsiaCityGym: MapType = {
  name: "Gimnasio Ciudad Fucsia",
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

export default fuchsiaCityGym;
