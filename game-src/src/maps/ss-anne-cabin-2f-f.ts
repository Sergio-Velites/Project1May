import image from "../assets/map/ss-anne-cabin-2f-f.png";
import { MapId, MapType } from "./map-types";

const ssAnneCabin2fF: MapType = {
  name: "Camarote F (2F)",
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
  exitReturnMap: MapId.SsAnne2f,
  exitReturnPos: { x: 29, y: 12 },
  music: "/game/music/maps-original/ss-anne.mp3",
  grass: {},
  fences: {},
  teleports: {
    6: {
      1: { map: MapId.SsAnne2f, pos: { x: 29, y: 12 } },
      2: { map: MapId.SsAnne2f, pos: { x: 29, y: 12 } },
    },
  },
  trainers: [],
};

export default ssAnneCabin2fF;
