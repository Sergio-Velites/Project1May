import { birdKeeper, bugCatcher, burglar, lass, oak, youngster } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/route-3.png";
import music from "../assets/music/maps/route-3.mp3";
import { Direction } from "../state/state-types";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

const route3: MapType = {
  name: "Ruta 3 · Camino de la Resaca",
  allowBicycle: true,
  image,
  music: music,
  height: 18,
  width: 70,
  start: { x: 1, y: 11 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 65, 66, 67, 68, 69],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 65, 66, 67, 68, 69],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 65, 66, 67, 68, 69],
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 28, 29, 30, 31, 32, 33, 50, 51, 52, 53, 54, 55, 65, 66, 67, 68, 69],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 29, 30, 31, 32, 33, 51, 52, 53, 54, 55, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    5: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 29, 30, 31, 32, 33, 51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 17, 23, 29, 30, 31, 32, 33, 38, 39, 40, 41, 42, 43, 51, 52, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    7: [17, 23, 39, 40, 41, 42, 43, 51, 52, 53, 54, 55, 66, 67, 68, 69],
    8: [4, 17, 23, 39, 40, 41, 42, 43, 51, 52, 53, 54, 55, 67, 68, 69],
    9: [17, 23, 39, 40, 41, 42, 43, 58, 59, 67, 68, 69],
    10: [9, 17, 23, 39, 40, 41, 42, 43, 67, 68, 69],
    11: [4, 9, 17, 23, 39, 40, 41, 42, 43, 67, 68, 69],
    12: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 23, 39, 40, 41, 42, 43, 67, 68, 69],
    13: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 23, 39, 40, 41, 42, 43, 67, 68, 69],
    14: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    16: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    17: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 39, 40, 41, 42, 43, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
  },
  fenceDirections: {
    0: { 64: Direction.Left },
    1: { 64: Direction.Left },
    2: { 64: Direction.Left },
    3: { 10: Direction.Down, 11: Direction.Down, 12: Direction.Down, 13: Direction.Down, 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 34: Direction.Down, 35: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down, 40: Direction.Down, 41: Direction.Down, 42: Direction.Down, 43: Direction.Down, 44: Direction.Down, 45: Direction.Down, 46: Direction.Down, 47: Direction.Down, 48: Direction.Down, 49: Direction.Down, 64: Direction.Left },
    4: { 28: Direction.Left, 50: Direction.Left },
    5: { 28: Direction.Left, 50: Direction.Left, 60: Direction.Left },
    6: { 28: Direction.Left, 50: Direction.Left, 60: Direction.Left },
    7: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 10: Direction.Down, 12: Direction.Down, 13: Direction.Down, 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 35: Direction.Down, 36: Direction.Down, 38: Direction.Left, 44: Direction.Down, 45: Direction.Down, 46: Direction.Down, 47: Direction.Down, 48: Direction.Down, 50: Direction.Left, 56: Direction.Down, 57: Direction.Down, 58: Direction.Down, 60: Direction.Down, 61: Direction.Down, 62: Direction.Down, 63: Direction.Down, 64: Direction.Down, 65: Direction.Down },
    8: { 38: Direction.Left, 50: Direction.Left, 66: Direction.Left },
    9: { 38: Direction.Left, 50: Direction.Down, 51: Direction.Down, 52: Direction.Down, 53: Direction.Down, 54: Direction.Down, 55: Direction.Down, 66: Direction.Left },
    10: { 38: Direction.Left, 66: Direction.Left },
    11: { 10: Direction.Down, 11: Direction.Down, 12: Direction.Down, 13: Direction.Down, 14: Direction.Down, 16: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 38: Direction.Left, 66: Direction.Left },
    12: { 38: Direction.Left, 66: Direction.Left },
    13: { 38: Direction.Left, 66: Direction.Left },
    14: { 38: Direction.Left },
    15: { 10: Direction.Left, 38: Direction.Left, 44: Direction.Left },
    16: { 10: Direction.Left, 38: Direction.Left, 44: Direction.Left },
    17: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 10: Direction.Left, 38: Direction.Left, 44: Direction.Left },
  },
  fences: {
    0: [64],
    1: [64],
    2: [64],
    3: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 64],
    4: [28, 50],
    5: [28, 50, 60],
    6: [28, 50, 60],
    7: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 24, 25, 26, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 44, 45, 46, 47, 48, 50, 56, 57, 58, 60, 61, 62, 63, 64, 65],
    8: [38, 50, 66],
    9: [38, 50, 51, 52, 53, 54, 55, 66],
    10: [38, 66],
    11: [10, 11, 12, 13, 14, 16, 18, 19, 20, 21, 22, 38, 66],
    12: [38, 66],
    13: [38, 66],
    14: [38],
    15: [10, 38, 44],
    16: [10, 38, 44],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 38, 44],
  },
  grass: {
    26: [60, 61, 62, 63, 64, 65],
    27: [60, 61, 62, 63, 64, 65],
    28: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 58, 59, 60, 61, 62, 63, 64, 65],
    29: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 58, 59, 60, 61, 62, 63, 64, 65],
    30: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 58, 59, 60, 61, 62, 63, 64, 65],
    31: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 58, 59, 60, 61, 62, 63, 64, 65],
  },
  text: {
    7: {
      67: [
        "MONTE LUNA DE MIEL",
        "¿Quién vuelve a casa así?"
      ],
    },
    27: {
      59: [
        "RUTA 3 · CAMINO DE LA RESACA",
        "Hacia el MONTE LUNA DE MIEL.",
        "Cuidado con los chupasangres,",
        "que ayer ya nos chuparon",
        "hasta la última copa."
      ],
    },
  },
  maps: {
    0: { 57: MapId.Route4, 58: MapId.Route4, 59: MapId.Route4, 60: MapId.Route4, 61: MapId.Route4, 62: MapId.Route4, 63: MapId.Route4, 64: MapId.Route4 },
    7: { 0: MapId.PewterCity },
    8: { 0: MapId.PewterCity },
    9: { 0: MapId.PewterCity },
    10: { 0: MapId.PewterCity },
    11: { 0: MapId.PewterCity },
    17: { 0: MapId.PewterCity },
  },
  exits: {

  },
  exitReturnMap: MapId.PewterCity,
  exitReturnPos: { x: 38, y: 17 },
  encounters: {
    walk: {
      rate: 21,
      pokemon: [
        { id: 16, chance: 20, conditionValues: [], minLevel: 11, maxLevel: 18 },
        { id: 16, chance: 15, conditionValues: [], minLevel: 13, maxLevel: 21 },
        { id: 17, chance: 10, conditionValues: [], minLevel: 16, maxLevel: 26 },
        { id: 21, chance: 20, conditionValues: [], minLevel: 9, maxLevel: 15 },
        { id: 21, chance: 10, conditionValues: [], minLevel: 12, maxLevel: 14 },
        { id: 21, chance: 10, conditionValues: [], minLevel: 12, maxLevel: 18 },
        { id: 22, chance: 5, conditionValues: [], minLevel: 17, maxLevel: 29 },
        { id: 39, chance: 5, conditionValues: [], minLevel: 7, maxLevel: 14 },
        { id: 39, chance: 4, conditionValues: [], minLevel: 10, maxLevel: 20 },
        { id: 40, chance: 2, conditionValues: [], minLevel: 18, maxLevel: 25 },
        { id: 128, chance: 1, conditionValues: [], minLevel: 25, maxLevel: 30 }
      ],
    },
    surf: { rate: 0, pokemon: [] },
    oldRod: {
      rate: 0,
      pokemon: [

      ],
    },
    goodRod: {
      rate: 0,
      pokemon: [

      ],
    },
    superRod: {
      rate: 0,
      pokemon: [

      ],
    },
    rockSmash: { rate: 0, pokemon: [] }, headbutt: { rate: 0, pokemon: [] }, darkGrass: { rate: 0, pokemon: [] },
    grassSpots: { rate: 0, pokemon: [] }, caveSpots: { rate: 0, pokemon: [] }, bridgeSpots: { rate: 0, pokemon: [] },
    superRodSpots: { rate: 0, pokemon: [] }, surfSpots: {
      rate: 0,
      pokemon: [

      ],
    },
    yellowFlowers: { rate: 0, pokemon: [] }, purpleFlowers: { rate: 0, pokemon: [] }, redFlowers: { rate: 0, pokemon: [] },
    roughTerrain: { rate: 0, pokemon: [] }, gift: { rate: 0, pokemon: [] }, giftEgg: { rate: 0, pokemon: [] }, onlyOne: { rate: 0, pokemon: [] },
  },
  items: [
    {
      item: ItemType.MasterBall,
      pos: { x: 63, y: 18 },
    },
  ],
  trainers: [
  {
    npc: oak,
    pokemon: [{ id: 122, level: 35 }, { id: 125, level: 37 }, { id: 124, level: 37 }, { id: 154, level: 39 }, { id: 157, level: 39 }, { id: 160, level: 40 }],
    facing: Direction.Right,
    pos: { x: 54, y: 6 },
    intro: [
      "Donde está CORTE?",
      "No hay más masterballs?",
      "Porque no puedo tener otro evee?",
      "Todo llorar..."
    ],
    outtro: [
      "Aún querrás más cosas no??'",
      "Sigue buscando, se han abierto nuevos caminos,",
      "Y nuevos pokémon salvajes han aparecido!"
    ],
    money: 2800,
    persistent: true,
    isGymLeader: true,
    sightRange: 0,
    postGame: {
          message: [
            "¡Toma, para que sigas con tus andanzas!",
            "Gracias por contribuir al juego.",
            "Y por supuesto, a la boda!",
            "¡Bebe más anís!",
          ],
          items: [ItemType.MasterBall, ItemType.Hm01],
        },
  },
  {
    npc: lass,
    pokemon: [{ id: 17, level: 26 }, { id: 20, level: 29 }],
    facing: Direction.Left,
    pos: { x: 63, y: 15 },
    intro: [
      "Eh… ¿tú también vienes de la boda?",
      "¡Pues a celebrar otra vez!"
    ],
    outtro: [
      "¡Marta y Sergio están ya",
      "haciendo las MALETAS para JAPÓN!"
    ],
    money: 135,
  },
  {
    npc: bugCatcher,
    pokemon: [{ id: 12, level: 19 }, { id: 15, level: 26 }],
    facing: Direction.Right,
    pos: { x: 24, y: 27 },
    intro: [
      "¿No te vi anoche bailando",
      "sobre una mesa en el SOTO?"
    ],
    outtro: [
      "Yo todavía llevo confeti",
      "en sitios donde no debería haber confeti."
    ],
    money: 100,
  },
  {
    npc: youngster,
    pokemon: [{ id: 19, level: 17 }, { id: 19, level: 21 }, { id: 20, level: 25 }],
    facing: Direction.Down,
    pos: { x: 59, y: 21 },
    intro: [
      "¡Hola! ¡Me gustan los pantalones cortos!",
      "¡Aunque hoy llevo el esmoquin aún puesto!"
    ],
    outtro: [
      "En la PC tengo guardado",
      "todo lo que vomité ayer… metafóricamente."
    ],
    money: 165,
  },
  {
    npc: bugCatcher,
    pokemon: [{ id: 10, level: 14 }, { id: 12, level: 19 }],
    facing: Direction.Down,
    pos: { x: 15, y: 22 },
    intro: [
      "¿Entrenador o invitado de boda?",
      "¡Da igual! ¡Pelea para despejarte!"
    ],
    outtro: [
      "Esta resaca es PEOR",
      "que un MEWTWO a nivel 70."
    ],
    money: 90,
  },
  {
    npc: youngster,
    pokemon: [{ id: 21, level: 20 }, { id: 19, level: 27 }],
    facing: Direction.Left,
    pos: { x: 27, y: 23 },
    intro: [
      "¡Ey! ¡Tú no llevas la pajarita torcida!",
      "¿Es que no fuiste al banquete?"
    ],
    outtro: [
      "¡Yo siempre llevo pantalones cortos!",
      "¡Hasta debajo del esmoquin!"
    ],
    money: 210,
  },
  {
    npc: lass,
    pokemon: [{ id: 39, level: 14 }, { id: 17, level: 21 }],
    facing: Direction.Left,
    pos: { x: 14, y: 26 },
    intro: [
      "Esa cara de resaca…",
      "¡también estuviste en VILLAMAYOR!"
    ],
    outtro: [
      "Dicen que MARTA y SERGIO",
      "vuelan a JAPÓN esta semana.",
      "¡Qué envidia me dan!"
    ],
    money: 150,
  },
  {
    npc: bugCatcher,
    pokemon: [{ id: 13, level: 14 }, { id: 15, level: 20 }],
    facing: Direction.Right,
    pos: { x: 10, y: 24 },
    intro: [
      "¡Ven a pelear!",
      "¡Necesito sudar el ANTÍS de anoche!"
    ],
    outtro: [
      "Mis PKMN también están con resaca.",
      "¡A todos nos sentó fatal el brindis!"
    ],
    money: 110,
  },
  {
    npc: lass,
    pokemon: [{ id: 19, level: 14 }, { id: 30, level: 25 }],
    facing: Direction.Up,
    pos: { x: 20, y: 24 },
    intro: [
      "¡Ay! ¡No me toques la cabeza!",
      "¡Me retumba como un GONG!"
    ],
    outtro: [
      "El MONTE LUNA DE MIEL",
      "queda al fondo de la ruta.",
      "¡Igual que la suite de los novios!"
    ],
    money: 210,
  },
  {
    npc: burglar,
    pokemon: [{ id: 24, level: 30 }],
    facing: Direction.Left,
    pos: { x: 69, y: 6 },
    intro: [
      "No me invitaron a la boda.",
      "Pero robaré los restos..."
    ],
    outtro: [
      "ay primo!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: birdKeeper,
    pokemon: [{ id: 22, level: 20 }, { id: 17, level: 25 }, { id: 83, level: 30 }],
    facing: Direction.Down,
    pos: { x: 46, y: 22 },
    intro: [
      "Menuda cara me llevas...",
      "Quieres un ibuprofeno?"
    ],
    outtro: [
      "Pues no hay ibuprofeno para ti!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: lass,
    pokemon: [{ id: 36, level: 28 }, { id: 108, level: 30 }],
    facing: Direction.Left,
    pos: { x: 61, y: 26 },
    intro: [
      "Ah!",
      "Gayyyyy!"
    ],
    outtro: [
      "Se dice propuesto?",
      "O proponido?"
    ],
    money: 0,
    persistent: true,
  }
  ],
  minimapPos: { x: 65, y: 52 },
  flyable: true,
  flySpot: { x: 61, y: 6 },
}

export default route3;
