import image from "../assets/map/victory-road-3f.png";
import { MapType } from "./map-types";

const victoryRoad3f: MapType = {
  name: "Camino Victoria 3F",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/victory-road.mp3",
  grass: {},
};

export default victoryRoad3f;
