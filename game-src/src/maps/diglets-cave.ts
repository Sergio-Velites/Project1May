import image from "../assets/map/digletts-cave.png";
import { MapType } from "./map-types";

const digletsCave: MapType = {
  name: "Cueva Diglett",
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

export default digletsCave;
