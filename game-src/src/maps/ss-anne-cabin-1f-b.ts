import image from "../assets/map/ss-anne-cabin-1f-b.png";
import { MapId, MapType } from "./map-types";

const ssAnneCabin1fB: MapType = {
  name: "Camarote B (1F)",
  image,
  height: 6,
  width: 4,
  start: { x: 1, y: 4 },
  walls: {
    0: [0, 1, 2, 3],
    1: [0, 3],
    2: [3],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.SsAnne1f,
  exitReturnPos: { x: 11, y: 7 },
  music: "/game/music/maps-original/ss-anne.mp3",
  grass: {},
  fences: {},
  teleports: {
    6: {
      1: { map: MapId.SsAnne1f, pos: { x: 11, y: 7 } },
      2: { map: MapId.SsAnne1f, pos: { x: 11, y: 7 } },
    },
  },
  trainers: [],
};

export default ssAnneCabin1fB;
