import image from "../assets/map/fuchsia-city-warden.png";
import { MapType } from "./map-types";

const fuchsiaCityWardenHouse: MapType = {
  name: "Casa del Guarda",
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

export default fuchsiaCityWardenHouse;
