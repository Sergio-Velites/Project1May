import image from "../assets/map/route-25.png";
import { Direction } from "../state/state-types";import { MapId, MapType } from "./map-types";
import { beauty, biker, blackBelt, lass, superNerd, youngster } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
const route25: MapType = {
  name: "Ruta 25",
  image,
  height: 18,
  width: 60,
  start: { x: 21, y: 11 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 21, 27, 37, 44, 45, 46, 47],
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 21, 27, 37, 38, 39, 40, 41, 42, 43, 44, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
    4: [21, 22, 23, 25, 31, 55],
    5: [12, 14, 16, 21, 25, 31, 55],
    6: [10, 11, 16, 18, 19, 21, 55],
    7: [8, 12, 16, 21, 28, 29, 55],
    8: [10, 12, 13, 16, 28, 55],
    9: [10, 16, 18, 28, 55],
    10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 55],
    11: [55],
    12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 55],
    13: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55],
    14: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    16: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  },
  water: {
    2: [56, 57, 58, 59],
    3: [56, 57, 58, 59],
    4: [56, 57, 58, 59],
    5: [56, 57, 58, 59],
    6: [56, 57, 58, 59],
    7: [56, 57, 58, 59],
    8: [38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 56, 57, 58, 59],
    9: [38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 56, 57, 58, 59],
    10: [38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 56, 57, 58, 59],
    11: [38, 39, 40, 41, 42, 43, 48, 49, 50, 51, 52, 53, 56, 57, 58, 59],
    12: [56, 57, 58, 59],
    13: [56, 57, 58, 59],
    14: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    15: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    16: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    17: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
  },
  fenceDirections: {
    7: {
      0: Direction.Down,
      1: Direction.Down,
      2: Direction.Down,
      3: Direction.Down,
      4: Direction.Down,
      5: Direction.Down,
      6: Direction.Down,
      7: Direction.Down,
    },
  },
  fences: {
    7: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  text: {
    3: {
      43: [
        "Estudio de Bill, el fotógrafo de bodas."
      ],
    },
  },
  trainers: [
  {
    npc: youngster,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Right,
    pos: { x: 20, y: 4 },
    intro: [],
    outtro: [
      "No preguntes. Sigue caminando. Por favor."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: lass,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 9, y: 6 },
    intro: [],
    outtro: [
      "¡Cogí el ramo y lo solté! ¿Ahora me caso o no?"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: superNerd,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 19, y: 7 },
    intro: [],
    outtro: [
      "Sé que aparqué. Lo que no sé es en qué provincia."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: blackBelt,
    pokemon: [{ id: 66, level: 51 }, { id: 56, level: 57 }],
    facing: Direction.Down,
    pos: { x: 27, y: 4 },
    intro: [
      "¿La meta es por aquí? Llevo desde ayer.",
      "¿Esto sigue siendo Bilbao?"
    ],
    outtro: [
      "¡Lo sabía! Esto NO era lo mío."
    ],
    money: 420,
  },
  {
    npc: biker,
    pokemon: [{ id: 109, level: 56 }, { id: 88, level: 59 }],
    facing: Direction.Down,
    pos: { x: 44, y: 4 },
    intro: [
      "En la boda dije que era el más duro, cuñao.",
      "Toca demostrarlo."
    ],
    outtro: [
      "…me piro antes de que se lo cuentes a nadie."
    ],
    money: 460,
  },
  {
    npc: superNerd,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Up,
    pos: { x: 46, y: 4 },
    intro: [],
    outtro: [
      "¡Ah!",
      "Tu eres el representante de los novios?",
      "No me abraces, tengo las manos ocupadas.",
      "Soy BILL, vuestro fotógrafo. Tengo 14.000 fotos vuestras.",
      "CATORCE MIL. Y la buena… sé que está ahí.",
      "Backup del backup del backup. Volved mañana."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: beauty,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 47, y: 8 },
    intro: [],
    outtro: [
      "En esta salgo yo. Y en esta. Y… anda, en esta también."
    ],
    money: 0,
    persistent: true,
  }
  ],
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-24-welcome.mp3",
  grass: {
    4: [2, 3, 4, 5, 6, 7],
    5: [2, 3, 4, 5, 6, 7],
  },
  teleports: {
    3: {
      45: { map: MapId.Route25BillsHouse, pos: { x: 3, y: 7 } },
    },
    4: {
      "-1": { map: MapId.Route24, pos: { x: 19, y: 4 } },
    },
    5: {
      "-1": { map: MapId.Route24, pos: { x: 19, y: 5 } },
    },
    6: {
      "-1": { map: MapId.Route24, pos: { x: 19, y: 6 } },
    },
    8: {
      "-1": { map: MapId.Route24, pos: { x: 19, y: 8 } },
    },
    9: {
      "-1": { map: MapId.Route24, pos: { x: 19, y: 9 } },
    },
    11: {
      "-1": { map: MapId.Route24, pos: { x: 19, y: 11 } },
    },
  },
  items: [
    {
      item: ItemType.GreatBall,
      pos: { x: 17, y: 9 },
    },
    {
      item: ItemType.UltraBall,
      pos: { x: 54, y: 5 },
    },
  ],
  berryTrees: [
    {
      pos: { x: 13, y: 2 },
      item: ItemType.GoldBerry,
    },
    {
      pos: { x: 24, y: 2 },
      item: ItemType.PsnCureBerry,
    },
  ],
};

export default route25;
