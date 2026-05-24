import image from "../assets/map/victory-road-2f.png";
import { MapType } from "./map-types";

const victoryRoad2f: MapType = {
  name: "Camino Victoria 2F",
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

export default victoryRoad2f;
