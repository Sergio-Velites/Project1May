import image from "../assets/map/route-5.png";
import { MapType } from "./map-types";

const route5: MapType = {
  name: "Ruta 5",
  image,
  height: 36,
  width: 20,
  start: { x: 10, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
};

export default route5;
