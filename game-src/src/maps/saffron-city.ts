import image from "../assets/map/saffron-city.png";
import { MapType } from "./map-types";

const saffronCity: MapType = {
  name: "Ciudad Azafran",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default saffronCity;
