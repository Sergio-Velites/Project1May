import image from "../assets/map/power-plant.png";
import { MapType } from "./map-types";

const powerPlant: MapType = {
  name: "Central Electrica",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  grass: {},
};

export default powerPlant;
