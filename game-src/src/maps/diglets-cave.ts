import image from "../assets/map/digletts-cave.png";
import { MapType } from "./map-types";

const digletsCave: MapType = {
  name: "Cueva Diglett",
  image,
  height: 25,
  width: 40,
  start: { x: 20, y: 23 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  grass: {},
};

export default digletsCave;
