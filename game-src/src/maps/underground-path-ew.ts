import image from "../assets/map/underground-path-ew.png";
import { MapType } from "./map-types";

const undergroundPathEW: MapType = {
  name: "Camino Subterráneo E-O",
  image,
  height: 10,
  width: 20,
  start: { x: 10, y: 8 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  grass: {},
};

export default undergroundPathEW;
