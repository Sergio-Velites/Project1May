import image from "../assets/map/route-2.png";
import music from "../assets/music/maps/route-1.mp3";
import getEncounterData from "./get-location-data";
import { bugCatcher, jrTrainerMale, lass, teamRocketGrunt, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const route2: MapType = {
  name: "Ruta 2",
  allowBicycle: true,
  image,
  music: music,
  height: 72,
  width: 20,
  start: { x: 8, y: 70 },
  walls: {
    0: [7, 10],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 15, 16, 17, 18, 19],
    2: [10],
    3: [10],
    4: [10],
    5: [10],
    6: [10, 11, 12, 13, 14, 15, 16, 17],
    7: [10, 17],
    8: [10, 17],
    9: [10, 11, 12, 13, 14, 15, 16, 17],
    10: [0, 1, 2, 4, 6, 7, 8, 9],
    11: [2, 4, 11],
    12: [2, 3, 4, 5],
    13: [2, 3, 4, 5],
    14: [2, 3, 4, 5],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    16: [8, 13],
    17: [8, 13],
    18: [8, 13, 14, 15, 16, 17],
    19: [8, 13, 14, 15, 16, 17],
    20: [8, 13],
    21: [8, 13],
    22: [0, 1, 2, 3, 4, 5, 6, 7, 14, 16, 17, 18, 19],
    23: [14],
    24: [13],
    25: [13],
    26: [13],
    27: [13],
    28: [13],
    29: [13],
    30: [13],
    31: [13],
    32: [13],
    33: [13],
    34: [13],
    35: [13, 14, 15, 18, 19],
    36: [13, 16, 17],
    37: [3, 13],
    38: [0, 1, 2, 4, 5, 6, 7, 8, 9, 13],
    39: [2, 4, 10, 13, 14, 15, 16, 17, 18, 19],
    40: [2, 3, 4, 5, 10, 13],
    41: [2, 3, 4, 5, 10, 13],
    42: [2, 3, 4, 5, 10, 13],
    43: [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 13],
    44: [11],
    45: [11],
    46: [11],
    47: [11],
    48: [11],
    49: [11],
    50: [11],
    51: [11],
    53: [6, 7, 8, 9, 10, 11, 12, 13],
    54: [5, 6, 7, 8, 9, 10, 11, 12],
    55: [5, 6, 7, 8, 9, 10, 11, 12],
    56: [6, 7, 8, 9, 10, 11, 12],
    57: [12],
    58: [12],
    59: [12],
    60: [0, 1],
    61: [1, 12],
    62: [1, 12],
    63: [1, 12],
    64: [1, 12],
    65: [1, 5, 12],
    66: [1, 12],
    67: [1, 12],
    68: [1],
    69: [1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    70: [2, 3, 4, 5, 6, 10],
    71: [6, 10],
  },
  fences: {
    19: [0, 1, 2, 3, 4, 5, 6, 7],
    27: [14, 15, 16, 18, 19],
    31: [14, 15, 16, 18, 19],
    43: [14, 16, 17, 18, 19],
    47: [0, 1, 2, 3, 4, 5, 6, 7],
    49: [12, 13, 14, 16, 17, 18, 19],
    61: [2, 3, 4, 5, 6, 8, 9, 10, 11],
  },
  grass: {
    2: [0, 1, 2, 3, 4, 5, 6, 7],
    3: [0, 1, 2, 3, 4, 5, 6, 7],
    4: [0, 1, 2, 3, 4, 5, 6, 7],
    5: [0, 1, 2, 3, 4, 5, 6, 7],
    6: [0, 1, 2, 3, 4, 5, 6, 7],
    7: [0, 1, 2, 3, 4, 5, 6, 7],
    20: [0, 1, 4, 5, 6, 7],
    21: [0, 1, 4, 5, 6, 7],
    48: [4, 5, 6, 7, 8, 9],
    49: [4, 5, 6, 7, 8, 9],
    50: [4, 5, 6, 7, 8, 9],
    51: [4, 5, 6, 7, 8, 9],
  },
  text: {
    11: {
      11: [
        "RUTA 2: El sendero de los valientes.",
        "¡La boda espera al final del camino!"
      ],
    },
    65: {
      5: [
        "RUTA 2: Ciudad Añil - Ciudad Plateada"
      ],
    },
  },
  maps: {},
  teleports: {
    "-1": {
      8: { map: MapId.PewterCity, pos: { x: 18, y: 34 } },
      9: { map: MapId.PewterCity, pos: { x: 19, y: 34 } },
    },
    9: {
      12: { map: MapId.DiglettsCave, pos: { x: 3, y: 6 } },
    },
    12: {
      3: { map: MapId.Route2GateNorth, pos: { x: 5, y: 1 } },
    },
    35: {
      16: { map: MapId.Route4Gate, pos: { x: 5, y: 1 } },
      17: { map: MapId.Route4Gate, pos: { x: 5, y: 1 } },
    },
    39: {
      15: { map: MapId.Route4Gate, pos: { x: 5, y: 7 } },
    },
    43: {
      3: { map: MapId.Route2Gate, pos: { x: 5, y: 7 } },
    },
    72: {
      7: { map: MapId.ViridianCity, pos: { x: 17, y: 0 } },
      8: { map: MapId.ViridianCity, pos: { x: 18, y: 0 } },
      9: { map: MapId.ViridianCity, pos: { x: 19, y: 0 } },
    },
  },
  exits: {},
  exitReturnMap: MapId.ViridianCity,
  exitReturnPos: { x: 18, y: 1 },
  encounters: {
    walk: {
      rate: 21,
      pokemon: [
        { id: 10, chance: 10, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 10, chance: 4, conditionValues: [], minLevel: 4, maxLevel: 4 },
        { id: 10, chance: 1, conditionValues: [], minLevel: 5, maxLevel: 5 },
        { id: 16, chance: 20, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 16, chance: 15, conditionValues: [], minLevel: 4, maxLevel: 4 },
        { id: 16, chance: 10, conditionValues: [], minLevel: 5, maxLevel: 5 },
        { id: 19, chance: 20, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 19, chance: 10, conditionValues: [], minLevel: 4, maxLevel: 4 },
        { id: 19, chance: 5, conditionValues: [], minLevel: 2, maxLevel: 2 },
        { id: 19, chance: 5, conditionValues: [], minLevel: 5, maxLevel: 5 }
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
  staticPokemon: [
    {
      pokemonId: 113,
      level: 20,
      sprite: "cute-a",
      pos: { x: 0, y: 2 },
      questId: "route-2-static-0-2",
      intro: [
        "A lo mejor me viene bien una enferemera para la postboda!",
      ],
    },
  ],
  cuttableTrees: [
    {
      pos: { x: 5, y: 10 },
      questId: "cut-tree-route-2-5-10",
    },
    {
      pos: { x: 12, y: 52 },
      questId: "cut-tree-route-2-12-52",
    },
    {
      pos: { x: 12, y: 60 },
      questId: "cut-tree-route-2-12-60",
    },
    {
      pos: { x: 12, y: 68 },
      questId: "cut-tree-route-2-12-68",
    },
    {
      pos: { x: 15, y: 22 },
      questId: "cut-tree-route-2-15-22",
    },
  ],
  trainers: [
  {
    npc: lass,
    pokemon: [{ id: 16, level: 7 }, { id: 19, level: 7 }],
    facing: Direction.Right,
    pos: { x: 6, y: 2 },
    intro: [
      "¡Salí a pasear y me perdí!",
      "¡Pero mientras espero, voy a entrenar!"
    ],
    outtro: [
      "La BODEGA CASTILLO DE MONJARDÍN está al norte. ¡No te pierdas tú también!"
    ],
    money: 105,
  },
  {
    npc: youngster,
    pokemon: [{ id: 19, level: 8 }, { id: 21, level: 8 }],
    facing: Direction.Down,
    pos: { x: 5, y: 48 },
    intro: [
      "¡Ey! ¡Un entrenador en la ruta!",
      "¡Me aburro mucho caminando solo!",
      "¡Vamos a combatir!"
    ],
    outtro: [
      "¡Buen combate! Ahora el camino se me hace más corto."
    ],
    money: 140,
  },
  {
    npc: bugCatcher,
    pokemon: [{ id: 13, level: 9 }, { id: 14, level: 9 }],
    facing: Direction.Left,
    pos: { x: 9, y: 62 },
    intro: [
      "¡Cuidado con pisar los bichos!",
      "¡Son mis guerreros de la boda!",
      "¡A ver si puedes con ellos!"
    ],
    outtro: [
      "¡Sorprendente! Sigue al norte, el bosque te espera."
    ],
    money: 110,
  },
  {
    npc: jrTrainerMale,
    pokemon: [{ id: 32, level: 10 }, { id: 23, level: 10 }],
    facing: Direction.Down,
    pos: { x: 7, y: 44 },
    intro: [
      "¡Alto! Este camino lleva al BOSQUECILLO.",
      "¡Solo los entrenadores preparados siguen adelante!",
      "¡Demuéstrame que estás listo!"
    ],
    outtro: [
      "¡Impresionante! El BOSQUECILLO te espera. Ten cuidado con los ZUBAT."
    ],
    money: 200,
  },
  {
    npc: youngster,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 12, y: 10 },
    intro: [],
    outtro: [
      "Ahí dentro está mas oscuro que tu futuro...",
      "No es momento de entrar aún",
      "Demuestra ser un auténtico Skullmen"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 157, level: 36 }],
    facing: Direction.Down,
    pos: { x: 15, y: 40 },
    intro: [
      "No te metas en los desarrollos de rocket development S.L."
    ],
    outtro: [
      "Largate de aquí",
      "El team rocket está desarrollando aún este sitio"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 168, level: 34 }],
    facing: Direction.Down,
    pos: { x: 15, y: 20 },
    intro: [
      "Que quieres?",
      "seguimos desarrollando"
    ],
    outtro: [
      "Todavía no chaval. ",
      "El Team rocket sigue desarrollando esta casa"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 34, level: 26 }, { id: 160, level: 33 }],
    facing: Direction.Up,
    pos: { x: 17, y: 35 },
    intro: [
      "Igual el proyecto está creciendo demasiado...",
      "un combate?"
    ],
    outtro: [
      "Este despliegue está costando más de lo pensado"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 20, level: 25 }, { id: 154, level: 33 }],
    facing: Direction.Up,
    pos: { x: 16, y: 35 },
    intro: [
      "Analizando...",
      "Diseñando...",
      "Programando...."
    ],
    outtro: [
      "Compilando... testando...",
      "Ahhh otro bug!"
    ],
    money: 0,
    persistent: true,
  }
  ],
  minimapPos: { x: 53, y: 92 },
}

export default route2;
