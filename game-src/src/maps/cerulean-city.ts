import image from "../assets/map/cerulean-city.png";
import { MapType } from "./map-types";
import { scientist, tamer, teamRocketGrunt } from "../app/npcs";
import { Direction } from "../state/state-types";

const ceruleanCity: MapType = {
  name: "Ciudad Celeste",
  image,
  height: 35,
  width: 38,
  start: { x: 20, y: 34 },
  walls: {
    0: [11, 17, 20, 24],
    1: [11, 17, 20, 24],
    2: [11, 17, 20, 24],
    3: [3, 4, 5, 6, 7, 8, 9, 10, 11, 17, 20, 21, 24],
    4: [3, 17, 20, 24],
    5: [3, 17, 20, 24],
    6: [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    7: [3, 5, 17, 20, 23, 32, 36],
    8: [3, 5, 17, 20, 23, 32, 36],
    9: [3, 5, 17, 20, 23, 32, 36],
    10: [3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 24, 25, 26, 27, 28, 29, 32, 37],
    11: [0, 1, 3, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 24, 26, 27, 28, 29, 32, 33, 34, 35, 36, 37],
    12: [5, 30, 36],
    13: [5, 30, 36],
    14: [5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 30, 36],
    15: [5, 10, 12, 13, 14, 15, 16, 19, 30, 36, 37],
    16: [5, 16, 19, 22, 23, 24, 25, 26, 27, 28, 29],
    17: [0, 1, 2, 3, 4, 5, 16, 18, 19, 22, 29],
    18: [22, 29, 36, 37],
    19: [21, 22, 23, 24, 25, 26, 27, 29, 36],
    20: [0, 1, 2, 33, 36],
    21: [2, 25, 33, 36],
    22: [2, 10, 11, 12, 13, 22, 23, 24, 25, 33, 36],
    23: [2, 10, 13, 22, 25, 33, 36],
    24: [2, 10, 13, 16, 17, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29, 30, 31, 33, 36],
    25: [2, 8, 9, 10, 12, 13, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 33, 36],
    26: [2, 33, 36],
    27: [2, 33, 36],
    28: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 36],
    29: [2, 13, 14, 15, 16, 36],
    30: [2, 36],
    31: [2, 36],
    32: [2, 8, 13, 22, 27, 36],
    33: [2, 3, 4, 5, 6, 7, 8, 13, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
  },
  text: {
    19: {
      21: [
        "La ciudad no es bonita.",
        "Y ya esta.",
        "Pero bueno, hay cosas"
      ],
    },
    21: {
      25: [
        "BEC Bilbao",
        "Hoy hay Hyrox"
      ],
    },
    25: {
      9: [
        "Tienda Velites.",
        "Equípate para tu Hyrox.",
        "Deja aquí tu pasta."
      ],
    },
    29: {
      15: [
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
    3: [22, 23],
    15: [7, 8, 9],
    19: [30, 31, 32, 35],
    33: [14, 15, 16, 17, 18, 19, 20, 21],
  },
  cuttableTrees: [
    {
      pos: { x: 17, y: 28 },
      questId: "cut-tree-cerulean-city-17-28",
    },
  ],
  boulders: [
    {
      pos: { x: 25, y: 12 },
      id: "boulder-cerulean-city-25-12",
    },
  ],
  minimapPos: { x: 148, y: 41 },
  trainers: [
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 19, y: 9 },
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
    pos: { x: 18, y: 9 },
    intro: [],
    outtro: [
      "Deja desarrollar al team rocket!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: tamer,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 28, y: 20 },
    intro: [],
    outtro: [
      "Todavía no es tu hora....",
      "Estás seguro de que puedes mejorar el tiempo de Marta y Sergio?",
      ""
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: scientist,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 17, y: 29 },
    intro: [],
    outtro: [
      "1+1 son 7... quien me lo iba a decir....",
      "Si...",
      "En efecto...",
      "Solo estoy aquí para molestar"
    ],
    money: 0,
    persistent: true,
  }
  ],
  water: {
    0: [12, 13, 14, 15, 16],
    1: [12, 13, 14, 15, 16],
    2: [12, 13, 14, 15, 16],
    3: [12, 13, 14, 15, 16],
    4: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    5: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
    6: [4],
    7: [4],
    8: [4],
    9: [4],
    10: [4],
    11: [4],
    12: [4],
    13: [4],
    14: [0, 1, 2, 3, 4],
    15: [0, 1, 2, 3, 4],
    16: [0, 1, 2, 3, 4],
  },
  fenceDirections: {
    3: {
      22: Direction.Down,
      23: Direction.Down,
    },
    15: {
      7: Direction.Down,
      8: Direction.Down,
      9: Direction.Down,
    },
    19: {
      30: Direction.Down,
      31: Direction.Down,
      32: Direction.Down,
      35: Direction.Down,
    },
    33: {
      14: Direction.Down,
      15: Direction.Down,
      16: Direction.Down,
      17: Direction.Down,
      18: Direction.Down,
      19: Direction.Down,
      20: Direction.Down,
      21: Direction.Down,
    },
  },
};

export default ceruleanCity;
