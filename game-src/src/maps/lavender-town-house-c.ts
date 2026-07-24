import image from "../assets/map/lavender-town-house-c.png";
import { MapId, MapType } from "./map-types";

const lavenderTownHouseC: MapType = {
  name: "Casa Pueblo Lavanda C",
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
  maps: {},
  exits: {},
  exitReturnMap: MapId.LavenderTown,
  exitReturnPos: { x: 7, y: 14 },
  music: "/game/music/maps-original/lavender-town.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.LavenderTown, pos: { x: 7, y: 14 } },
      3: { map: MapId.LavenderTown, pos: { x: 7, y: 14 } },
    },
  },
  trainers: [],
};

export default lavenderTownHouseC;
