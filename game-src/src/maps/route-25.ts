import image from "../assets/map/route-25.png";
import { MapType } from "./map-types";

const route25: MapType = {
  name: "Ruta 25",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-24-welcome.mp3",
  grass: {},
};

export default route25;
