import image from "../assets/map/indigo-plateau.png";
import { MapType } from "./map-types";

const championRoom: MapType = {
  name: "Campeon",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
};

export default championRoom;
