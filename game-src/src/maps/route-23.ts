import image from "../assets/map/route-23.png";
import { MapType } from "./map-types";

const route23: MapType = {
  name: "Ruta 23",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/victory-road.mp3",
  grass: {},
  fences: {},
  minimapPos: { x: 10, y: 114 },
  trainers: [],
};

export default route23;
