import image from "../assets/map/elite-four-3.png";
import { MapId, MapType } from "./map-types";

const eliteFour3: MapType = {
  name: "Alto Mando - Sala 3",
  image,
  height: 12,
  width: 10,
  start: { x: 6, y: 10 },
  walls: {
    0: [0, 1, 2, 3, 6, 7, 8, 9],
    2: [0, 7, 9],
    3: [0, 1, 8],
    4: [0, 1, 3, 7, 8, 9],
    5: [0, 1, 6, 8, 9],
    6: [1, 2, 7, 9],
    7: [0, 2, 3, 6, 8],
    8: [0, 1, 3, 7, 8, 9],
    9: [0, 1, 3, 6, 8, 9],
    10: [0, 2, 3, 7, 9],
    11: [0, 1, 2, 3, 6, 7, 8, 9],
  },
  text: {},
  maps: {
    0: { 4: MapId.EliteFour4, 5: MapId.EliteFour4 },
    11: { 4: MapId.EliteFour2, 5: MapId.EliteFour2 },
  },
  exits: {

  },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 28, y: 41 },
};

export default eliteFour3;
