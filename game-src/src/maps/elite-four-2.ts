import image from "../assets/map/elite-four-2.png";
import { MapType } from "./map-types";

const eliteFour2: MapType = {
  name: "Alto Mando - Sala 2",
  image,
  height: 12,
  width: 10,
  start: { x: 7, y: 11 },
  walls: {
    0: [0, 1, 2, 3, 6, 7, 8, 9],
    2: [0, 1, 8, 9],
    3: [0],
    4: [0, 9],
    5: [0, 1, 2, 7, 8, 9],
    6: [0, 2, 3, 8],
    7: [0, 1, 6, 7, 8, 9],
    8: [0, 1, 6, 8, 9],
    9: [0, 2, 3, 6, 7, 8],
    10: [1, 3, 6, 7, 9],
    11: [0, 1, 8, 9],
  },
  text: {},
  maps: {
    0: { 4: MapId.EliteFour3, 5: MapId.EliteFour3 },
    11: { 4: MapId.EliteFour1, 5: MapId.EliteFour1 },
  },
  exits: {

  },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 70, y: 45 },
};

export default eliteFour2;
