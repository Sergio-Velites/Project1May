import image from "../assets/map/fuchsia-city.png";
import { MapType } from "./map-types";

const fuchsiaCity: MapType = {
  name: "Ciudad Fucsia",
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

export default fuchsiaCity;
