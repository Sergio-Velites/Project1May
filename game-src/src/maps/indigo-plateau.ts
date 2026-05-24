import image from "../assets/map/indigo-plateau.png";
import { MapType } from "./map-types";

const indigoPlateau: MapType = {
  name: "Meseta Anil",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/indigo-plateau.mp3",
  grass: {},
};

export default indigoPlateau;
