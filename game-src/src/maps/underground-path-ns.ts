import image from "../assets/map/underground-path-ns.png";
import { MapType } from "./map-types";

const undergroundPathNS: MapType = {
  name: "Camino Subterráneo N-S",
  image,
  height: 20,
  width: 10,
  start: { x: 5, y: 18 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  grass: {},
};

export default undergroundPathNS;
