import image from "../assets/map/ss-anne-cabin-2f-c.png";
import { MapId, MapType } from "./map-types";

const ssAnneCabin2fC: MapType = {
  name: "Camarote C (2F)",
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
  exitReturnPos: { x: 17, y: 12 },
  music: "/game/music/maps-original/ss-anne.mp3",
  grass: {},
  fences: {},
  teleports: {
    6: {
      1: { map: MapId.SsAnne2f, pos: { x: 17, y: 12 } },
      2: { map: MapId.SsAnne2f, pos: { x: 17, y: 12 } },
    },
  },
  trainers: [],
};

export default ssAnneCabin2fC;
