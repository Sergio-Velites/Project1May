import image from "../assets/map/vermilion-city.png";
import { MapType } from "./map-types";

const vermilionCity: MapType = {
  name: "Ciudad Carmin",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/vermilion-city.mp3",
  grass: {},
};

export default vermilionCity;
