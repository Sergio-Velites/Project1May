import image from "../assets/map/ss-anne-captain.png";
import { MapId, MapType } from "./map-types";

const ssAnneCaptain: MapType = {
  name: "Camarote del Capitán",
  image,
  height: 8,
  width: 6,
  start: { x: 1, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5],
    1: [1, 4, 5],
    2: [0, 1, 2, 4],
    3: [0, 1, 2, 5],
    5: [5],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.SsAnne3f,
  exitReturnPos: { x: 1, y: 2 },
  music: "/game/music/maps-original/ss-anne.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      0: { map: MapId.SsAnne3f, pos: { x: 1, y: 2 } },
      1: { map: MapId.SsAnne3f, pos: { x: 1, y: 2 } },
    },
  },
  trainers: [],
};

export default ssAnneCaptain;
