import image from "../assets/map/saffron-city.png";
import { MapType } from "./map-types";

const saffronCity: MapType = {
  name: "Ciudad Azafran",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default saffronCity;
