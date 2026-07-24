import image from "../assets/map/cerulean-city.png";
import { MapId, MapType } from "./map-types";
import { beauty, blackBelt, gentleman, jrTrainerFemale, lass, teamRocketGrunt, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";

const ceruleanCity: MapType = {
  name: "Ciudad Celeste",
  image,
  height: 36,
  width: 40,
  start: { x: 2, y: 18 },
  walls: {
    0: [13, 19, 22, 26],
    1: [13, 19, 22, 26],
    2: [13, 19, 22, 26],
    3: [5, 6, 7, 8, 9, 10, 11, 12, 13, 19, 22, 23, 26],
    4: [5, 19, 22, 26],
    5: [5, 19, 22, 26],
    6: [5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
    7: [5, 7, 19, 22, 25, 34, 38],
    8: [5, 7, 19, 22, 25, 34, 38],
    9: [5, 7, 19, 22, 25, 34, 38],
    10: [5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 26, 28, 29, 30, 31, 34, 39],
    11: [0, 1, 2, 3, 5, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 26, 28, 29, 30, 31, 34, 35, 36, 37, 38, 39],
    12: [7, 32, 38],
    13: [7, 32, 38],
    14: [7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 32, 38],
    15: [7, 12, 14, 15, 16, 17, 18, 21, 32, 38, 39],
    16: [7, 18, 19, 21, 24, 25, 26, 27, 28, 29, 30, 31],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 18, 20, 21, 24, 31],
    18: [24, 30, 31, 38, 39],
    19: [23, 24, 25, 26, 27, 28, 29, 31, 38],
    20: [0, 1, 2, 3, 4, 35, 38],
    21: [4, 27, 35, 38],
    22: [4, 12, 13, 14, 15, 24, 25, 26, 27, 35, 38],
    23: [4, 12, 15, 24, 27, 35, 38],
    24: [4, 12, 13, 15, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 30, 31, 32, 33, 35, 38],
    25: [4, 10, 11, 12, 14, 15, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 35, 38],
    26: [4, 35, 38],
    27: [4, 35, 38],
    28: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 38],
    29: [4, 15, 16, 17, 18, 38],
    30: [4, 38],
    31: [4, 38],
    32: [4, 10, 15, 24, 29, 38],
    33: [4, 5, 6, 7, 8, 9, 10, 15, 24, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
    34: [10, 15, 24, 29],
    35: [10, 15, 24, 29],
  },
  text: {
    19: {
      23: [
        "La ciudad no es bonita.",
        "Y ya esta.",
        "Pero bueno, hay cosas"
      ],
    },
    21: {
      27: [
        "BEC Bilbao",
        "Hoy hay Hyrox"
      ],
    },
    25: {
      11: [
        "Tienda Velites.",
        "Equípate para tu Hyrox.",
        "Deja aquí tu pasta."
      ],
    },
    29: {
      17: [
        "Tips para una buena Hyrox:",
        "huye!"
      ],
    },
  },
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
  allowBicycle: true,
  fences: {
    3: [24, 25],
    15: [9, 10, 11],
    19: [32, 33, 34, 37],
    33: [16, 17, 18, 19, 20, 21, 22, 23],
  },
  cuttableTrees: [
    {
      pos: { x: 19, y: 28 },
      questId: "cut-tree-cerulean-city-17-28",
    },
  ],
  boulders: [
    {
      pos: { x: 27, y: 12 },
      id: "boulder-cerulean-city-25-12",
    },
    {
      pos: { x: 4, y: 18 },
      id: "boulder-cerulean-city-2-18",
    },
    {
      pos: { x: 4, y: 19 },
      id: "boulder-cerulean-city-2-19",
    },
  ],
  trainers: [
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 21, y: 9 },
    intro: [],
    outtro: [
      "Deja desarrollar al team rocket!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 20, y: 9 },
    intro: [],
    outtro: [
      "Deja desarrollar al team rocket!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: youngster,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 12, y: 16 },
    intro: [],
    outtro: [
      "¿Dorsal? ¿No? Entonces… ¿qué haces con energía?"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: beauty,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 21, y: 18 },
    intro: [],
    outtro: [
      "Si todavía puedes hablar, es que no has calentado."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: lass,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 14, y: 26 },
    intro: [],
    outtro: [
      "Llevo cuatro estaciones y sigo sin encontrar la meta."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: blackBelt,
    pokemon: [{ id: 66, level: 18 }, { id: 56, level: 18 }],
    facing: Direction.Left,
    pos: { x: 31, y: 20 },
    intro: [
      "¿Tú corres maratones? Qué monada.",
      "Yo arrastro trineos. Tipo HYROX, chaval."
    ],
    outtro: [
      "Ganas… pero seguro que no sabes hacer un wall ball."
    ],
    money: 360,
  },
  {
    npc: jrTrainerFemale,
    pokemon: [{ id: 61, level: 19 }, { id: 67, level: 20 }],
    facing: Direction.Down,
    pos: { x: 30, y: 26 },
    intro: [
      "Un runner me dijo 'esto es fácil'.",
      "Ya no está entre nosotros."
    ],
    outtro: [
      "Vale, vale… pero eso NO es funcional."
    ],
    money: 400,
  },
  {
    npc: gentleman,
    pokemon: [{ id: 107, level: 20 }, { id: 106, level: 20 }],
    facing: Direction.Up,
    pos: { x: 23, y: 22 },
    intro: [
      "Rango de movimiento incompleto.",
      "Repetición no contada. Empezamos de cero."
    ],
    outtro: [
      "Repetición… válida. Enhorabuena, supongo."
    ],
    money: 400,
  }
  ],
  water: {
    0: [14, 15, 16, 17, 18],
    1: [14, 15, 16, 17, 18],
    2: [14, 15, 16, 17, 18],
    3: [14, 15, 16, 17, 18],
    4: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    5: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    6: [6],
    7: [6],
    8: [6],
    9: [6],
    10: [6],
    11: [6],
    12: [6],
    13: [6],
    14: [0, 1, 2, 3, 4, 5, 6],
    15: [0, 1, 2, 3, 4, 5, 6],
    16: [0, 1, 2, 3, 4, 5, 6],
  },
  fenceDirections: {
    3: {
      24: Direction.Down,
      25: Direction.Down,
    },
    15: {
      9: Direction.Down,
      10: Direction.Down,
      11: Direction.Down,
    },
    19: {
      32: Direction.Down,
      33: Direction.Down,
      34: Direction.Down,
      37: Direction.Down,
    },
    33: {
      16: Direction.Down,
      17: Direction.Down,
      18: Direction.Down,
      19: Direction.Down,
      20: Direction.Down,
      21: Direction.Down,
      22: Direction.Down,
      23: Direction.Down,
    },
  },
  recoverLocation: { x: 19, y: 18 },
  flyable: true,
  flySpot: { x: 19, y: 18 },
  flyUnlockTiles: {
    18: [19],
  },
  teleports: {
    0: {
      20: { map: MapId.Route24, pos: { x: 10, y: 25 } },
      21: { map: MapId.Route24, pos: { x: 10, y: 25 } },
      23: { map: MapId.Route24, pos: { x: 10, y: 25 } },
      24: { map: MapId.Route24, pos: { x: 10, y: 25 } },
      25: { map: MapId.Route24, pos: { x: 10, y: 25 } },
    },
    6: {
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    7: {
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    8: {
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    9: {
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    10: {
      9: { map: MapId.CeruleanCityHouseC, pos: { x: 3, y: 1 } },
      27: { map: MapId.CeruleanCityHouseB, pos: { x: 3, y: 1 } },
    },
    11: {
      9: { map: MapId.CeruleanCityHouseC, pos: { x: 3, y: 7 } },
      4: { map: MapId.CeruleanCave1f, pos: { x: 25, y: 17 } },
      27: { map: MapId.CeruleanCityHouseB, pos: { x: 3, y: 7 } },
    },
    12: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    13: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    14: {
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    15: {
      13: { map: MapId.CeruleanCityHouseA, pos: { x: 3, y: 7 } },
    },
    16: {
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    17: {
      19: { map: MapId.CeruleanCityPokemonCenter, pos: { x: 4, y: 7 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    18: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
    },
    19: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      30: { map: MapId.CeruleanCityGym, pos: { x: 5, y: 13 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    20: {
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    21: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    22: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    23: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    24: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    25: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      13: { map: MapId.CeruleanCityBikeShop, pos: { x: 3, y: 7 } },
      25: { map: MapId.CeruleanCityPokeMart, pos: { x: 4, y: 7 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    26: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    27: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    28: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    29: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    30: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    31: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    32: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    33: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    34: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
    35: {
      0: { map: MapId.Route4, pos: { x: 64, y: 23 } },
      1: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      2: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      3: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      4: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      5: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      6: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      7: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      8: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      9: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      11: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      12: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      13: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      14: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      16: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      17: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      18: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      19: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      20: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      21: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      22: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      23: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      25: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      26: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      27: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      28: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      30: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      31: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      32: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      33: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      34: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      35: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      36: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      37: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      38: { map: MapId.Route5, pos: { x: 14, y: 32 } },
      39: { map: MapId.Route9, pos: { x: 24, y: 15 } },
    },
  },
  minimapPos: { x: 147, y: 40 },
};

export default ceruleanCity;
