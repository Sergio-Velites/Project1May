import image from "../assets/map/victory-road-1f.png";
import { MapId, MapType } from "./map-types";

const victoryRoad1f: MapType = {
  name: "Camino Victoria 1F",
  image,
  height: 18,
  width: 20,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  teleports: {
    1: {
      1: { map: MapId.VictoryRoad2f, pos: { x: 0, y: 9 } },
    },
    18: {
      8: { map: MapId.LeagueRoute, pos: { x: 5, y: 50 } },
      9: { map: MapId.LeagueRoute, pos: { x: 5, y: 50 } },
    },
  },
  exits: {},
  exitReturnMap: MapId.Route23,
  exitReturnPos: { x: 4, y: 32 },
  music: "/game/music/maps-original/victory-road.mp3",
  grass: {},
  minimapPos: { x: 29, y: 65 },
  fences: {},
  trainers: [],
};

export default victoryRoad1f;
