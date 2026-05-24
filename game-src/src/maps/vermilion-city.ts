import image from "../assets/map/vermilion-city.png";
import { MapType } from "./map-types";

const vermilionCity: MapType = {
  name: "Ciudad Carmin",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/vermilion-city.mp3",
  grass: {},
};

export default vermilionCity;
