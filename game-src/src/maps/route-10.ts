import image from "../assets/map/route-10.png";
import { MapType } from "./map-types";

const route10: MapType = {
  name: "Ruta 10",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-11.mp3",
  grass: {},
};

export default route10;
