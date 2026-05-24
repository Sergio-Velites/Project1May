import image from "../assets/map/route-5.png";
import { MapType } from "./map-types";

const route5: MapType = {
  name: "Ruta 5",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
};

export default route5;
