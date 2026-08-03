import image from "../assets/map/route-9.png";
import { Direction } from "../state/state-types";import { MapId, MapType } from "./map-types";
import { blackBelt, pokeManiac, youngster } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
const route9: MapType = {
  name: "Ruta 9",
  image,
  height: 18,
  width: 60,
  start: { x: 24, y: 15 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    2: [5, 26, 27, 28, 29, 34, 35, 36, 37, 52, 53, 54, 55, 56, 57, 58, 59],
    3: [5, 26, 27, 28, 29, 34, 35, 36, 37, 52, 53, 54, 55, 56, 57, 58, 59],
    4: [5, 16, 17, 18, 19, 26, 27, 28, 29, 34, 35, 36, 37, 46, 47, 48, 49, 52, 53, 54, 55, 56, 57, 58, 59],
    5: [5, 16, 17, 18, 19, 26, 27, 28, 29, 34, 35, 36, 37, 46, 47, 48, 49, 52, 53, 54, 55, 56, 57, 58, 59],
    6: [5, 16, 17, 18, 19, 26, 27, 28, 29, 46, 47, 48, 49, 52, 53, 54, 55, 56, 57, 58, 59],
    7: [0, 1, 2, 3, 4, 5, 14, 16, 17, 18, 19, 25, 26, 27, 28, 29, 46, 47, 48, 49, 52, 53, 54, 55, 56, 57, 58, 59],
    8: [14, 15, 16, 17, 18, 19, 30, 31, 32, 33, 36, 37, 38, 39, 42, 43, 44, 45],
    9: [4, 14, 15, 16, 17, 18, 19, 30, 31, 32, 33, 36, 37, 38, 39, 42, 43, 44, 45],
    10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19, 30, 31, 32, 33, 36, 37, 38, 39, 42, 43, 44, 45, 48, 49, 50, 51, 54, 55, 56, 57, 58, 59],
    11: [5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19, 30, 31, 32, 33, 36, 37, 38, 39, 42, 43, 44, 45, 48, 49, 50, 51, 54, 55, 56, 57, 58, 59],
    12: [5, 6, 7, 8, 9, 24, 25, 26, 27, 42, 43, 44, 45, 48, 49, 50, 51, 54, 55, 56, 57, 58, 59],
    13: [5, 6, 7, 8, 9, 24, 25, 26, 27, 42, 43, 44, 45, 48, 49, 50, 51, 54, 55, 56, 57, 58, 59],
    14: [5, 6, 7, 8, 9, 24, 25, 26, 27, 54, 55, 56, 57, 58, 59],
    15: [5, 6, 7, 8, 9, 24, 25, 26, 27, 54, 55, 56, 57, 58, 59],
    16: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    17: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  },
  fenceDirections: {
    5: {
      20: Direction.Down,
      21: Direction.Down,
      22: Direction.Down,
      23: Direction.Down,
      24: Direction.Down,
      30: Direction.Down,
      32: Direction.Down,
      33: Direction.Down,
      38: Direction.Down,
      40: Direction.Down,
      41: Direction.Down,
      42: Direction.Down,
      43: Direction.Down,
      44: Direction.Down,
      45: Direction.Down,
      50: Direction.Down,
      51: Direction.Down,
    },
    7: {
      6: Direction.Down,
      7: Direction.Down,
      8: Direction.Down,
      9: Direction.Down,
      10: Direction.Down,
      11: Direction.Down,
      12: Direction.Down,
      13: Direction.Down,
    },
    9: {
      20: Direction.Down,
      21: Direction.Down,
      22: Direction.Down,
      23: Direction.Down,
      24: Direction.Down,
      25: Direction.Down,
      26: Direction.Down,
      27: Direction.Down,
      28: Direction.Down,
    },
    11: {
      10: Direction.Down,
      11: Direction.Down,
      12: Direction.Down,
      13: Direction.Down,
      34: Direction.Down,
      35: Direction.Down,
      40: Direction.Down,
      46: Direction.Down,
      47: Direction.Down,
      52: Direction.Down,
      53: Direction.Down,
    },
    13: {
      10: Direction.Down,
      11: Direction.Down,
      12: Direction.Down,
      13: Direction.Down,
      14: Direction.Down,
      15: Direction.Down,
      16: Direction.Down,
      17: Direction.Down,
      18: Direction.Down,
      20: Direction.Down,
      21: Direction.Down,
      22: Direction.Down,
      23: Direction.Down,
      28: Direction.Down,
      30: Direction.Down,
      31: Direction.Down,
      32: Direction.Down,
      33: Direction.Down,
      34: Direction.Down,
      35: Direction.Down,
      36: Direction.Down,
      37: Direction.Down,
      38: Direction.Down,
      39: Direction.Down,
      40: Direction.Down,
      41: Direction.Down,
      46: Direction.Down,
      47: Direction.Down,
      52: Direction.Down,
      53: Direction.Down,
    },
  },
  fences: {
    5: [20, 21, 22, 23, 24, 30, 32, 33, 38, 40, 41, 42, 43, 44, 45, 50, 51],
    7: [6, 7, 8, 9, 10, 11, 12, 13],
    9: [20, 21, 22, 23, 24, 25, 26, 27, 28],
    11: [10, 11, 12, 13, 34, 35, 40, 46, 47, 52, 53],
    13: [10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 46, 47, 52, 53],
  },
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-11.mp3",
  grass: {
    2: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 30, 31, 32, 33],
    3: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 30, 31, 32, 33],
    4: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    5: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  teleports: {
    8: {
      "-1": { map: MapId.CeruleanCity, pos: { x: 39, y: 16 } },
      60: { map: MapId.Route10, pos: { x: 0, y: 7 } },
    },
    9: {
      "-1": { map: MapId.CeruleanCity, pos: { x: 39, y: 17 } },
      60: { map: MapId.Route10, pos: { x: 0, y: 8 } },
    },
  },
  cuttableTrees: [
    {
      pos: { x: 5, y: 8 },
      questId: "cut-tree-route-9-5-8",
    },
  ],
  trainers: [
  {
    npc: youngster,
    pokemon: [{ id: 12, level: 50 }, { id: 241, level: 57 }, { id: 128, level: 63 }, { id: 217, level: 70 }],
    facing: Direction.Down,
    pos: { x: 10, y: 8 },
    intro: [
      "Estaba en la mesa de los niños durante la boda!",
      "Mientras todos bebíais anís, yo entrené duro!"
    ],
    outtro: [
      "Igual es mejor que beba anís..."
    ],
    money: 100,
    persistent: true,
  },
  {
    npc: pokeManiac,
    pokemon: [{ id: 131, level: 55 }, { id: 233, level: 57 }, { id: 142, level: 59 }, { id: 112, level: 61 }, { id: 208, level: 63 }, { id: 221, level: 65 }],
    facing: Direction.Left,
    pos: { x: 23, y: 12 },
    intro: [
      "Pensaba que todo friki entraba en la boda. ",
      "Pero me dejaron fuera..."
    ],
    outtro: [
      "PEC"
    ],
    money: 250,
    persistent: true,
  },
  {
    npc: blackBelt,
    pokemon: [{ id: 67, level: 60 }, { id: 106, level: 63 }, { id: 107, level: 65 }, { id: 237, level: 68 }, { id: 57, level: 70 }],
    facing: Direction.Down,
    pos: { x: 41, y: 6 },
    intro: [
      "A un tal juanle tu vel?",
      "Muchas ostias tenel que dal!",
      "Celveza bebel, ostia que dal!"
    ],
    outtro: [
      "Juanle ya en tailandia estal?"
    ],
    money: 280,
    persistent: true,
  }
  ],
  items: [
    {
      item: ItemType.UltraBall,
      pos: { x: 7, y: 3 },
    },
    {
      item: ItemType.BlackBelt,
      pos: { x: 32, y: 3 },
    },
    {
      item: ItemType.QuickClaw,
      pos: { x: 53, y: 15 },
    },
    {
      item: ItemType.ScopeLens,
      pos: { x: 51, y: 2 },
    },
  ],
  minimapPos: { x: 172, y: 39 },
};

export default route9;
