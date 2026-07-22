import image from "../assets/map/elite-four-1.png";
import { MapId, MapType } from "./map-types";

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
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  fences: {},
  teleports: {
    0: {
      4: { map: MapId.EliteFour2, pos: { x: 4, y: 10 } },
      5: { map: MapId.EliteFour2, pos: { x: 5, y: 10 } },
    },
    11: {
      4: { map: MapId.IndigoPlateauLobby, pos: { x: 8, y: 1 } },
      5: { map: MapId.IndigoPlateauLobby, pos: { x: 8, y: 1 } },
    },
  },
  trainers: [],
};

export default eliteFour1;
