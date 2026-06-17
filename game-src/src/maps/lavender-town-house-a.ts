import image from "../assets/map/lavender-town-house-a.png";
import { MapType } from "./map-types";

const lavenderTownHouseA: MapType = {
  name: "Casa Pueblo Lavanda",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  music: "/game/music/maps-original/lavender-town.mp3",
  grass: {},
  minimapPos: { x: 200, y: 87 },
};

export default lavenderTownHouseA;
