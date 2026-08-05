import image from "../assets/map/champion-room.png";
import { MapId, MapType } from "./map-types";
import { chetaNpc, chinNpc } from "../app/npcs";
import { Direction } from "../state/state-types";

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
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.EliteFour4, pos: { x: 5, y: 0 } },
      4: { map: MapId.EliteFour4, pos: { x: 6, y: 0 } },
    },
  },
  trainers: [
  {
    npc: chinNpc,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 3, y: 0 },
    intro: [],
    outtro: [
      "..."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: chetaNpc,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 4, y: 0 },
    intro: [],
    outtro: [
      "..."
    ],
    money: 0,
    persistent: true,
  }
  ],
};

export default championRoom;
