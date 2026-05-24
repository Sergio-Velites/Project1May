import image from "../assets/map/route-21.png";
import { MapType } from "./map-types";

const route21: MapType = {
  name: "Ruta 21",
  image,
  height: 50,
  width: 20,
  start: { x: 10, y: 48 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/surf.mp3",
  grass: {},
};

export default route21;
