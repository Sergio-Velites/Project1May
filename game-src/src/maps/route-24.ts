import image from "../assets/map/route-24.png";
import { MapType } from "./map-types";

const route24: MapType = {
  name: "Ruta 24",
  image,
  height: 27,
  width: 20,
  start: { x: 10, y: 25 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-24-welcome.mp3",
  grass: {},
};

export default route24;
