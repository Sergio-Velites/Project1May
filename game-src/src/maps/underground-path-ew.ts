import image from "../assets/map/underground-path-ew.png";
import { MapType } from "./map-types";

const undergroundPathEW: MapType = {
  name: "Camino Subterráneo E-O",
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

export default undergroundPathEW;
