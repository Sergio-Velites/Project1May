import image from "../assets/map/route-21.png";
import { MapType } from "./map-types";

const route21: MapType = {
  name: "Ruta 21",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/surf.mp3",
  grass: {},
};

export default route21;
