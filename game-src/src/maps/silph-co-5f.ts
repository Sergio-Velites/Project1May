import image from "../assets/map/silph-co-5f.png";
import { MapType } from "./map-types";

const silphCo5f: MapType = {
  name: "Silph S.A. 5F",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/silph-co.mp3",
  grass: {},
};

export default silphCo5f;
