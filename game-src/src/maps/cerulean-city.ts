import image from "../assets/map/cerulean-city.png";
import { MapType } from "./map-types";

const ceruleanCity: MapType = {
  name: "Ciudad Celeste",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
};

export default ceruleanCity;
