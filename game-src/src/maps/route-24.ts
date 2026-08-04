import image from "../assets/map/route-24.png";
import { Direction } from "../state/state-types";import { MapId, MapType } from "./map-types";
import { aceTrainerFemale, beauty, gambler, gentleman } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
const route24: MapType = {
  name: "Ruta 24",
  image,
  height: 36,
  width: 20,
  start: { x: 10, y: 25 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    4: [0, 1, 2, 3],
    5: [0, 1, 2, 3],
    6: [0, 1, 2, 3],
    7: [0, 1, 2, 3],
    8: [0, 1, 2, 3],
    9: [0, 1, 2, 3],
    10: [0, 1, 2, 3, 12, 13, 14, 15, 16, 17, 18, 19],
    11: [0, 1, 2, 3, 12],
    12: [0, 1, 2, 3, 12, 16, 17, 18, 19],
    13: [0, 1, 2, 3, 12, 16, 17, 18, 19],
    14: [0, 1, 2, 3, 12, 16, 17, 18, 19],
    15: [0, 1, 2, 3, 12, 16, 17, 18, 19],
    16: [0, 1, 2, 3, 9, 12, 16, 17, 18, 19],
    17: [0, 1, 2, 3, 9, 12, 16, 17, 18, 19],
    18: [0, 1, 2, 3, 9, 12, 16, 17, 18, 19],
    19: [0, 1, 2, 3, 9, 12, 16, 17, 18, 19],
    20: [0, 1, 2, 3, 9, 12, 16, 17, 18, 19],
    21: [0, 1, 2, 3, 9, 12, 16, 17, 18, 19],
    22: [0, 1, 2, 3, 9, 12, 15],
    23: [0, 1, 2, 3, 9, 12, 15],
    24: [0, 1, 2, 3, 9, 12, 15],
    25: [0, 1, 2, 3, 9, 12, 15],
    26: [0, 1, 2, 3, 9, 12, 15],
    27: [0, 1, 2, 3, 9, 12, 15],
    28: [0, 1, 2, 3, 9, 12, 15],
    29: [0, 1, 2, 3, 9, 12, 15],
    30: [0, 1, 2, 3, 9, 12, 15],
    31: [0, 1, 2, 3, 9, 12, 15],
    32: [0, 1, 2, 3, 9, 12, 15],
    33: [0, 1, 2, 3, 9, 12, 15],
    34: [0, 1, 2, 3, 9, 12, 15],
    35: [0, 1, 2, 3, 9, 12, 15],
  },
  water: {
    16: [6, 7, 8],
    17: [6, 7, 8],
    18: [6, 7, 8],
    19: [6, 7, 8],
    20: [6, 7, 8],
    21: [6, 7, 8],
    22: [6, 7, 8, 16, 17, 18, 19],
    23: [6, 7, 8, 16, 17, 18, 19],
    24: [6, 7, 8, 16, 17, 18, 19],
    25: [6, 7, 8, 16, 17, 18, 19],
    26: [6, 7, 8, 16, 17, 18, 19],
    27: [6, 7, 8, 16, 17, 18, 19],
    28: [6, 7, 8, 16, 17, 18, 19],
    29: [6, 7, 8, 16, 17, 18, 19],
    30: [6, 7, 8, 16, 17, 18, 19],
    31: [6, 7, 8, 16, 17, 18, 19],
    32: [4, 5, 6, 7, 8, 16, 17, 18, 19],
    33: [4, 5, 6, 7, 8, 16, 17, 18, 19],
    34: [4, 5, 6, 7, 8, 16, 17, 18, 19],
    35: [4, 5, 6, 7, 8, 16, 17, 18, 19],
  },
  fenceDirections: {
    4: {
      13: Direction.Right,
      16: Direction.Left,
    },
    5: {
      13: Direction.Right,
      16: Direction.Left,
    },
    6: {
      13: Direction.Right,
      16: Direction.Left,
    },
    7: {
      4: Direction.Down,
      5: Direction.Down,
      7: Direction.Down,
      8: Direction.Down,
      9: Direction.Down,
      10: Direction.Down,
      11: Direction.Down,
      12: Direction.Down,
      13: Direction.Down,
      16: Direction.Down,
      17: Direction.Down,
      18: Direction.Down,
      19: Direction.Down,
    },
  },
  fences: {
    4: [13, 16],
    5: [13, 16],
    6: [13, 16],
    7: [4, 5, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19],
  },
  text: {},
  trainers: [
  {
    npc: gentleman,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Right,
    pos: { x: 6, y: 5 },
    intro: [],
    outtro: [
      "Qué boda más bonita… ¿tú de parte de quién eras?"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: beauty,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Left,
    pos: { x: 7, y: 5 },
    intro: [],
    outtro: [
      "De la novia. Creo. O del vino. Uno de los dos."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: gambler,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Up,
    pos: { x: 14, y: 4 },
    intro: [],
    outtro: [
      "Ayer dije que bailaba bien. Hoy digo que gomito mejor."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: gentleman,
    pokemon: [{ id: 58, level: 50 }, { id: 17, level: 57 }],
    facing: Direction.Down,
    pos: { x: 16, y: 8 },
    intro: [
      "Necesito quemar la barra libre de ayer.",
      "¿Me ayudas con un combate?"
    ],
    outtro: [
      "Uf. Creo que he sudado vino. Gracias, campeón."
    ],
    money: 440,
  },
  {
    npc: aceTrainerFemale,
    pokemon: [{ id: 35, level: 45 }, { id: 182, level: 57 }],
    facing: Direction.Down,
    pos: { x: 11, y: 13 },
    intro: [
      "Cogimos el ramo entre las tres.",
      "Esto lo arreglamos combatiendo."
    ],
    outtro: [
      "Vale, quédate tú el ramo. Nosotras la barra."
    ],
    money: 420,
  }
  ],
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-24-welcome.mp3",
  grass: {
    18: [4, 5],
    19: [4, 5],
    20: [4, 5],
    21: [4, 5],
    22: [4, 5],
    23: [4, 5],
    24: [4, 5],
    25: [4, 5],
    26: [4, 5],
    27: [4, 5],
    28: [4, 5],
    29: [4, 5],
    30: [4, 5],
    31: [4, 5],
  },
  teleports: {
    4: {
      20: { map: MapId.Route25, pos: { x: 0, y: 4 } },
    },
    5: {
      20: { map: MapId.Route25, pos: { x: 0, y: 5 } },
    },
    6: {
      20: { map: MapId.Route25, pos: { x: 0, y: 6 } },
    },
    8: {
      20: { map: MapId.Route25, pos: { x: 0, y: 8 } },
    },
    9: {
      20: { map: MapId.Route25, pos: { x: 0, y: 9 } },
    },
    11: {
      20: { map: MapId.Route25, pos: { x: 0, y: 11 } },
    },
    36: {
      4: { map: MapId.CeruleanCity, pos: { x: 14, y: 0 } },
      5: { map: MapId.CeruleanCity, pos: { x: 15, y: 0 } },
      6: { map: MapId.CeruleanCity, pos: { x: 16, y: 0 } },
      7: { map: MapId.CeruleanCity, pos: { x: 17, y: 0 } },
      8: { map: MapId.CeruleanCity, pos: { x: 18, y: 0 } },
      10: { map: MapId.CeruleanCity, pos: { x: 2, y: 18 } },
      11: { map: MapId.CeruleanCity, pos: { x: 2, y: 18 } },
      13: { map: MapId.CeruleanCity, pos: { x: 2, y: 18 } },
      14: { map: MapId.CeruleanCity, pos: { x: 2, y: 18 } },
    },
  },
  gifts: [
    {
      pokemonId: 155,
      level: 5,
      pos: { x: 18, y: 5 },
      questId: "route-24-gift-18-5",
    },
  ],
  items: [
    {
      item: ItemType.GreatBall,
      pos: { x: 5, y: 29 },
    },
    {
      item: ItemType.GreatBall,
      pos: { x: 15, y: 21 },
    },
  ],
  berryTrees: [
    {
      pos: { x: 11, y: 5 },
      item: ItemType.Berry,
    },
  ],
};

export default route24;
