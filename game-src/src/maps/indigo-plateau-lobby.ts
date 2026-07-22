import image from "../assets/map/indigo-plateau-lobby.png";
import { MapId, MapType } from "./map-types";

const indigoPlateauLobby: MapType = {
  name: "Liga Pokémon",
  image,
  height: 12,
  width: 16,
  start: { x: 7, y: 10 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15],
    1: [0, 1, 2, 3, 10, 11, 12, 13, 14, 15],
    2: [10, 11, 12, 13, 14, 15],
    3: [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    4: [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15],
    5: [1, 4, 5, 6, 9, 10, 11],
    6: [0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15],
    7: [15],
    8: [0, 1, 2, 3],
    9: [0, 1, 2, 3],
    10: [12, 13, 14, 15],
    11: [12, 13, 14, 15],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.IndigoPlateau,
  exitReturnPos: { x: 9, y: 6 },
  grass: {},
  fences: {},
  teleports: {
    0: {
      8: { map: MapId.EliteFour1, pos: { x: 5, y: 11 } },
    },
    12: {
      7: { map: MapId.LeagueRoute, pos: { x: 10, y: 6 } },
      8: { map: MapId.LeagueRoute, pos: { x: 11, y: 6 } },
    },
  },
  trainers: [],
};

export default indigoPlateauLobby;
