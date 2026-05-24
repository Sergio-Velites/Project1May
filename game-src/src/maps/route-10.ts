import image from "../assets/map/gate-house.png";
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
  grass: {},
};

export default route10;
