import image from "../assets/map/victory-road-1f.png";
import { MapType } from "./map-types";

const victoryRoad1f: MapType = {
  name: "Camino Victoria 1F",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/victory-road.mp3",
  grass: {},
};

export default victoryRoad1f;
