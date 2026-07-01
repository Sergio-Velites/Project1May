import image from "../assets/map/cerulean-city.png";
import { MapId, MapType } from "./map-types";
import { scientist, tamer, teamRocketGrunt } from "../app/npcs";
import { Direction } from "../state/state-types";

const ceruleanCity: MapType = {
  name: "Ciudad Celeste",
  image,
  height: 36,
  width: 40,
  start: { x: 0, y: 18 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    3: [0, 1, 2, 3, 4, 5, 14, 15, 16, 17, 18, 19, 22, 23, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38],
    7: [0, 1, 2, 3, 4, 5, 6, 7, 19, 22, 25, 34, 35, 36, 37, 38],
    8: [0, 1, 2, 3, 4, 5, 6, 7, 19, 22, 25, 34, 35, 36, 37, 38],
    9: [0, 1, 2, 3, 4, 5, 6, 7, 19, 22, 25, 34, 35, 36, 37, 38],
    10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 26, 27, 28, 29, 30, 31, 34, 35, 36, 37, 38, 39],
    11: [6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 26, 28, 29, 30, 31, 34, 35, 36, 37, 38, 39],
    12: [6, 7, 32, 38],
    13: [6, 7, 32, 38],
    14: [0, 1, 2, 3, 4, 5, 6, 7, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 32, 38],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 12, 14, 15, 16, 17, 18, 19, 20, 21, 32, 38, 39],
    16: [0, 1, 2, 3, 4, 5, 6, 7, 18, 19, 20, 21, 24, 25, 26, 27, 28, 29, 30, 31],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 18, 20, 21, 24, 25, 26, 27, 28, 29, 30, 31],
    18: [24, 25, 26, 27, 28, 29, 30, 31, 38, 39],
    19: [23, 24, 25, 26, 27, 28, 29, 31, 38],
    20: [0, 1, 2, 3, 4, 35, 38],
    21: [4, 27, 35, 38],
    22: [4, 12, 13, 14, 15, 24, 25, 26, 27, 35, 38],
    23: [4, 12, 13, 14, 15, 24, 25, 26, 27, 35, 38],
    24: [4, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 38],
    25: [4, 10, 11, 12, 14, 15, 18, 19, 20, 21, 22, 23, 24, 26, 27, 28, 29, 30, 31, 32, 33, 35, 38],
    26: [4, 35, 38],
    27: [4, 35, 38],
    28: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 38],
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
  maps: {
    0: { 20: MapId.Route24, 21: MapId.Route24, 23: MapId.Route24, 24: MapId.Route24, 25: MapId.Route24 },
    6: { 39: MapId.Route9 },
    7: { 39: MapId.Route9 },
    8: { 39: MapId.Route9 },
    9: { 27: MapId.CeruleanCityHouseB, 39: MapId.Route9 },
    11: { 0: MapId.Route4, 4: MapId.CeruleanCave1f, 27: MapId.CeruleanCityHouseB },
    12: { 0: MapId.Route4, 39: MapId.Route9 },
    13: { 0: MapId.Route4, 39: MapId.Route9 },
    14: { 39: MapId.Route9 },
    15: { 13: MapId.CeruleanCityHouseA },
    16: { 39: MapId.Route9 },
    17: { 19: MapId.CeruleanCityPokemonCenter, 39: MapId.Route9 },
    18: { 0: MapId.Route4 },
    19: { 0: MapId.Route4, 30: MapId.CeruleanCityGym, 39: MapId.Route9 },
    20: { 39: MapId.Route9 },
    21: { 0: MapId.Route4, 39: MapId.Route9 },
    22: { 0: MapId.Route4, 39: MapId.Route9 },
    23: { 0: MapId.Route4, 39: MapId.Route9 },
    24: { 0: MapId.Route4, 39: MapId.Route9 },
    25: { 0: MapId.Route4, 13: MapId.CeruleanCityBikeShop, 25: MapId.CeruleanCityPokeMart, 39: MapId.Route9 },
    26: { 0: MapId.Route4, 39: MapId.Route9 },
    27: { 0: MapId.Route4, 39: MapId.Route9 },
    28: { 0: MapId.Route4, 39: MapId.Route9 },
    29: { 0: MapId.Route4, 39: MapId.Route9 },
    30: { 0: MapId.Route4, 39: MapId.Route9 },
    31: { 0: MapId.Route4, 39: MapId.Route9 },
    32: { 0: MapId.Route4, 39: MapId.Route9 },
    33: { 0: MapId.Route4, 39: MapId.Route9 },
    34: { 0: MapId.Route4, 39: MapId.Route9 },
    35: { 0: MapId.Route4, 1: MapId.Route5, 2: MapId.Route5, 3: MapId.Route5, 4: MapId.Route5, 5: MapId.Route5, 6: MapId.Route5, 7: MapId.Route5, 8: MapId.Route5, 9: MapId.Route5, 11: MapId.Route5, 12: MapId.Route5, 13: MapId.Route5, 14: MapId.Route5, 16: MapId.Route5, 17: MapId.Route5, 18: MapId.Route5, 19: MapId.Route5, 20: MapId.Route5, 21: MapId.Route5, 22: MapId.Route5, 23: MapId.Route5, 25: MapId.Route5, 26: MapId.Route5, 27: MapId.Route5, 28: MapId.Route5, 30: MapId.Route5, 31: MapId.Route5, 32: MapId.Route5, 33: MapId.Route5, 34: MapId.Route5, 35: MapId.Route5, 36: MapId.Route5, 37: MapId.Route5, 38: MapId.Route5, 39: MapId.Route9 },
  },
  exits: {

  },
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
  allowBicycle: true,
  fences: {
    3: [6, 7, 8, 9, 10, 11, 12, 13, 24, 25],
    11: [0, 1, 2, 3, 5],
    15: [9, 10, 11],
    17: [22, 23],
    19: [32, 33, 34, 37],
    33: [16, 17, 18, 19, 20, 21, 22, 23],
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
  minimapPos: { x: 147, y: 41 },
  flyable: true,
  flySpot: { x: 19, y: 18 },
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
      "Menudas patas de gallina me llevas."
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
    3: { 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 10: Direction.Down, 11: Direction.Down, 12: Direction.Down, 13: Direction.Down, 24: Direction.Down, 25: Direction.Down },
    11: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 5: Direction.Down },
    15: { 9: Direction.Down, 10: Direction.Down, 11: Direction.Down },
    17: { 22: Direction.Down, 23: Direction.Down },
    19: { 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 37: Direction.Down },
    33: { 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down },
  },
  recoverLocation: { x: 17, y: 18 },
};

export default ceruleanCity;
