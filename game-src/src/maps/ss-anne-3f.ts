import image from "../assets/map/ss-anne-3f.png";
import { MapId, MapType } from "./map-types";

const ssAnne3f: MapType = {
  name: "S.S. Aguamarina 3F",
  image,
  height: 6,
  width: 20,
  start: { x: 19, y: 3 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    2: [0, 1, 18, 19],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  },
  text: {},
  maps: {

  },
  teleports: {
    3: { 19: { map: MapId.SsAnne2f, pos: { x: 2, y: 12 } } },
  },
  exits: {

  },
  music: "/game/music/maps-original/ss-anne.mp3",
  grass: {},
};

export default ssAnne3f;
