import image from "../assets/map/gate-house.png";
import { MapType } from "./map-types";

const vermilionCityPokeMart: MapType = {
  name: "Tienda Pokemon",
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

export default vermilionCityPokeMart;
