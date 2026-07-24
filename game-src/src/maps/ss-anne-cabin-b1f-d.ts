import image from "../assets/map/ss-anne-cabin-b1f-d.png";
import { MapId, MapType } from "./map-types";

const ssAnneCabinB1fD: MapType = {
  name: "Camarote D (Bodega)",
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
  exitReturnMap: MapId.SsAnneBf1,
  exitReturnPos: { x: 19, y: 4 },
  music: "/game/music/maps-original/ss-anne.mp3",
  grass: {},
  fences: {},
  teleports: {
    6: {
      1: { map: MapId.SsAnneBf1, pos: { x: 19, y: 4 } },
      2: { map: MapId.SsAnneBf1, pos: { x: 19, y: 4 } },
    },
  },
  trainers: [],
};

export default ssAnneCabinB1fD;
