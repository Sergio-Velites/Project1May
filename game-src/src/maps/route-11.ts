import image from "../assets/map/route-11.png";
import { MapType } from "./map-types";

const route11: MapType = {
  name: "Ruta 11",
  image,
  height: 20,
  width: 50,
  start: { x: 25, y: 18 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-11.mp3",
  grass: {},
};

export default route11;
