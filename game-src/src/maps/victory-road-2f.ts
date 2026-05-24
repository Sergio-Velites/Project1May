import image from "../assets/map/victory-road-2f.png";
import { MapType } from "./map-types";

const victoryRoad2f: MapType = {
  name: "Camino Victoria 2F",
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

export default victoryRoad2f;
