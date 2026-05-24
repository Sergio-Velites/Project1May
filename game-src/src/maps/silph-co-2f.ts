import image from "../assets/map/silph-co-2f.png";
import { MapType } from "./map-types";

const silphCo2f: MapType = {
  name: "Silph S.A. 2F",
  image,
  height: 33,
  width: 40,
  start: { x: 20, y: 31 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/silph-co.mp3",
  grass: {},
};

export default silphCo2f;
