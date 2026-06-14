import image from "../assets/map/indigo-plateau.png";
import { MapType } from "./map-types";

const indigoPlateau: MapType = {
  name: "Meseta Anil",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/indigo-plateau.mp3",
  grass: {},
  fences: {},
  minimapPos: { x: 26, y: 29 },
  trainers: [],
};

export default indigoPlateau;
