import image from "../assets/map/silph-co-3f.png";
import { MapType } from "./map-types";

const silphCo3f: MapType = {
  name: "Silph S.A. 3F",
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

export default silphCo3f;
