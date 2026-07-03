import image from "../assets/map/champion-room.png";
import { MapId, MapType } from "./map-types";

const championRoom: MapType = {
  name: "Campeon",
  image,
  height: 8,
  width: 8,
  start: { x: 6, y: 6 },
  walls: {
    0: [0, 1, 2, 5, 6, 7],
    1: [0, 2, 5, 7],
    2: [0, 7],
    3: [0, 7],
    4: [0, 7],
    5: [0, 7],
    6: [0, 2, 5, 7],
    7: [0, 1, 2, 5, 6, 7],
  },
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  minimapPos: { x: 29, y: 41 },
  fences: {},
  teleports: {
    7: {
      3: { map: MapId.EliteFour4, pos: { x: 5, y: 1 } },
      4: { map: MapId.EliteFour4, pos: { x: 6, y: 1 } },
    },
  },
  trainers: [],
};

export default championRoom;
