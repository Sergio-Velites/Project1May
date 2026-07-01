import image from "../assets/map/elite-four-1.png";
import { MapType } from "./map-types";

const eliteFour1: MapType = {
  name: "Alto Mando - Sala 1",
  image,
  height: 12,
  width: 10,
  start: { x: 5, y: 11 },
  walls: {
    0: [0, 1, 2, 3, 6, 7, 8, 9],
    1: [0, 1, 2, 3, 6, 7, 8, 9],
    2: [0, 1, 8, 9],
    3: [0, 1, 8, 9],
    4: [0, 1, 8, 9],
    5: [0, 1, 8, 9],
    6: [0, 1, 2, 3, 6, 7, 8, 9],
    7: [0, 1, 2, 3, 6, 7, 8, 9],
    8: [0, 1, 2, 3, 6, 7, 8, 9],
    9: [0, 1, 2, 3, 6, 7, 8, 9],
    10: [0, 1, 2, 3, 6, 7, 8, 9],
    11: [0, 1, 2, 3, 6, 7, 8, 9],
  },
  text: {},
  maps: {
    0: { 4: MapId.EliteFour2, 5: MapId.EliteFour2 },
    11: { 4: MapId.IndigoPlateauLobby, 5: MapId.IndigoPlateauLobby },
  },
  exits: {

  },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 28, y: 41 },
};

export default eliteFour1;
