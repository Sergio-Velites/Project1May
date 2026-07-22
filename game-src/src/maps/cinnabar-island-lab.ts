import image from "../assets/map/cinnabar-island-lab.png";
import { MapId, MapType } from "./map-types";

const cinnabarIslandLab: MapType = {
  name: "Laboratorio de Cinabria",
  image,
  height: 8,
  width: 18,
  start: { x: 10, y: 7 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    3: [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    4: [6, 7, 9, 10, 11, 13, 14, 15, 17],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  exitReturnMap: MapId.CinnabarIsland,
  exitReturnPos: { x: 6, y: 10 },
  music: "/game/music/maps-original/pokemon-lab.mp3",
  grass: {},
};

export default cinnabarIslandLab;
