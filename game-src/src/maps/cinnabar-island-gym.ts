import image from "../assets/map/cinnabar-island-gym.png";
import { MapId, MapType } from "./map-types";

const cinnabarIslandGym: MapType = {
  name: "Gimnasio Isla Cinabria",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 2, 3, 4, 5, 6, 8, 10, 11],
    2: [0, 6, 8, 14],
    3: [0, 6, 8, 14],
    4: [0, 6, 8, 14],
    5: [0, 6, 8, 14],
    6: [0, 1, 2, 3, 6, 8, 9, 10, 11, 14, 15, 16, 17],
    7: [0, 1, 6, 8, 9, 14, 15],
    8: [0, 6, 8, 14],
    9: [0, 6, 8, 14],
    10: [0, 6, 8, 14],
    11: [0, 6, 8, 14, 15, 16, 17],
    12: [0, 1, 2, 3, 6, 8, 9, 10, 11, 14, 17],
    13: [0, 1, 6, 8, 9, 14, 17],
    14: [0, 6, 8, 14],
    15: [0, 6, 7, 8, 14],
    16: [0, 14],
    17: [0, 14],
  },
  text: {},
  maps: {

  },
  exits: {
    17: [16, 17],
  },
  exitReturnMap: MapId.CinnabarIsland,
  exitReturnPos: { x: 18, y: 4 },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 53, y: 195 },
};

export default cinnabarIslandGym;
