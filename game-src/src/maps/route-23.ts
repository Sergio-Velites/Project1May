import image from "../assets/map/route-23.png";
import { MapType } from "./map-types";

const route23: MapType = {
  name: "Ruta 23",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/victory-road.mp3",
  grass: {},
};

export default route23;
