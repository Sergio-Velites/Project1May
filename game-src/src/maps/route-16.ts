import image from "../assets/map/route-16.png";
import { MapType } from "./map-types";

const route16: MapType = {
  name: "Ruta 16",
  image,
  height: 20,
  width: 30,
  start: { x: 15, y: 18 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/bicycle.mp3",
  grass: {},
};

export default route16;
