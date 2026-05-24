import image from "../assets/map/celadon-city.png";
import { MapType } from "./map-types";

const celadonCity: MapType = {
  name: "Ciudad Celedon",
  image,
  height: 50,
  width: 60,
  start: { x: 30, y: 48 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCity;
