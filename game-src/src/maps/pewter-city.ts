import image from "../assets/map/pewter-city.png";
import { MapId, MapType } from "./map-types";
import { aceTrainerMale, beauty, hiker, jrTrainerMale, scientist, teamRocketGrunt } from "../app/npcs";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/pewter-city.mp3";

const pewterCity: MapType = {
  name: "VILLAMAYOR DE MONJARDÍN",
  allowBicycle: true,
  image,
  music: music,
  height: 36,
  width: 40,
  start: { x: 19, y: 34 },
  walls: {
    1: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
    2: [3, 10, 17, 23, 35],
    3: [3, 10, 17, 23, 24, 25, 26, 27, 35],
    4: [3, 10, 17, 19, 23, 35],
    5: [3, 10, 17, 18, 20, 21, 22, 23, 26, 27, 35],
    6: [3, 10, 14, 17, 27, 35],
    7: [3, 10, 11, 12, 13, 15, 16, 17, 27, 35],
    8: [3, 29, 30, 35],
    9: [3, 15, 35],
    10: [3, 15, 25, 34],
    11: [3, 34],
    12: [3, 28, 29, 30, 31, 34],
    13: [3, 28, 30, 31, 34],
    14: [3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 34],
    15: [3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 34, 35, 36, 37, 38, 39],
    16: [3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25],
    17: [3, 11, 12, 13, 14, 15, 17, 22, 24, 25],
    18: [3, 18],
    19: [3, 18, 33],
    20: [3, 18, 34, 35, 36, 37, 38, 39],
    21: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 34],
    22: [3, 8, 12, 13, 14, 15, 18, 34],
    23: [3, 12, 13, 14, 15, 22, 23, 24, 25, 26, 27, 28, 29, 34],
    24: [3, 12, 13, 14, 15, 21, 30, 34],
    25: [3, 12, 14, 15, 21, 30, 34, 35],
    26: [3, 21, 30, 35],
    27: [3, 21, 30, 35],
    28: [3, 6, 7, 8, 9, 21, 30, 35],
    29: [3, 6, 8, 9, 19, 21, 30, 35],
    30: [3, 28, 35],
    31: [3, 35],
    32: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    33: [17, 20],
    34: [17, 20],
    35: [17, 20],
  },
  fences: {
    7: [4, 5, 6, 8, 9, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 32, 33, 34],
    29: [22, 23, 24, 26, 27, 28, 29],
  },
  grass: {},
  text: {
    9: {
      15: [
        "BODEGA CASTILLO DE MONJARDÍN",
        "Tipo VINO · ¡Ven a brindar!"
      ],
    },
    17: {
      11: [
        "SERGIO Y MARTA, guardianes de la BODEGA.",
        "¡Solo los que merezcan brindar podrán pasar!"
      ],
    },
    19: {
      33: [
        "¡AVISO!",
        "El Team Rocket intenta robar la reserva especial.",
        "¡Repórtalo al organizador de la boda!"
      ],
    },
    23: {
      25: [
        "VILLAMAYOR DE MONJARDÍN",
        "Tierra del mejor vino de la comarca."
      ],
    },
    29: {
      19: [
        "CONSEJO DE BODA",
        "El que llega tarde a la preboda,",
        "¡pierde turno en la barra libre!"
      ],
    },
  },
  textRewards: {
    8: {
      29: {
        type: "pokemon",
        pokemonId: 151,
        level: 20,
        questId: "text-reward-pewter-city-29-8",
      },
    },
  },
  maps: {},
  teleports: {
    5: {
      19: { map: MapId.PewterCityMuseum1f, pos: { x: 17, y: 7 } },
    },
    7: {
      14: { map: MapId.PewterCityMuseum1f, pos: { x: 10, y: 7 } },
    },
    13: {
      29: { map: MapId.PewterCityNpcB, pos: { x: 3, y: 7 } },
    },
    16: {
      40: { map: MapId.Route3, pos: { x: 0, y: 8 } },
    },
    17: {
      16: { map: MapId.PewterCityGym, pos: { x: 4, y: 13 } },
      23: { map: MapId.PewterCityPokeMart, pos: { x: 4, y: 7 } },
      40: { map: MapId.Route3, pos: { x: 0, y: 9 } },
    },
    18: {
      40: { map: MapId.Route3, pos: { x: 0, y: 10 } },
    },
    19: {
      40: { map: MapId.Route3, pos: { x: 0, y: 11 } },
    },
    25: {
      13: { map: MapId.PewterCityPokemonCenter, pos: { x: 4, y: 7 } },
    },
    29: {
      7: { map: MapId.PewterCityNpcA, pos: { x: 3, y: 7 } },
    },
    36: {
      18: { map: MapId.Route2, pos: { x: 8, y: 0 } },
      19: { map: MapId.Route2, pos: { x: 9, y: 0 } },
    },
  },
  exits: {},
  exitReturnMap: MapId.Route2GateNorth,
  exitReturnPos: { x: 5, y: 1 },
  recoverLocation: { x: 13, y: 26 },
  staticPokemon: [
    {
      pokemonId: 143,
      level: 20,
      sprite: "monster-b",
      pos: { x: 29, y: 24 },
      questId: "pewter-city-static-29-24",
    },
    {
      pokemonId: 151,
      level: 20,
      sprite: "none",
      pos: { x: 29, y: 8 },
      questId: "pewter-city-static-29-8",
      intro: [
        "Te falta la llave... eh espera, si está abierto!",
      ],
    },
    {
      pokemonId: 100,
      level: 20,
      sprite: "ball-a",
      pos: { x: 26, y: 6 },
      questId: "pewter-city-static-26-6",
      intro: [
        "...",
      ],
    },
  ],
  cuttableTrees: [
    {
      pos: { x: 17, y: 19 },
      questId: "cut-tree-pewter-city-17-19",
    },
    {
      pos: { x: 16, y: 19 },
      questId: "cut-tree-pewter-city-16-19",
    },
    {
      pos: { x: 17, y: 20 },
      questId: "cut-tree-pewter-city-17-20",
    },
    {
      pos: { x: 16, y: 20 },
      questId: "cut-tree-pewter-city-16-20",
    },
    {
      pos: { x: 15, y: 19 },
      questId: "cut-tree-pewter-city-15-19",
    },
    {
      pos: { x: 15, y: 20 },
      questId: "cut-tree-pewter-city-15-20",
    },
    {
      pos: { x: 14, y: 19 },
      questId: "cut-tree-pewter-city-14-19",
    },
    {
      pos: { x: 14, y: 20 },
      questId: "cut-tree-pewter-city-14-20",
    },
    {
      pos: { x: 13, y: 19 },
      questId: "cut-tree-pewter-city-13-19",
    },
    {
      pos: { x: 13, y: 20 },
      questId: "cut-tree-pewter-city-13-20",
    },
    {
      pos: { x: 12, y: 19 },
      questId: "cut-tree-pewter-city-12-19",
    },
    {
      pos: { x: 12, y: 20 },
      questId: "cut-tree-pewter-city-12-20",
    },
    {
      pos: { x: 26, y: 4 },
      questId: "cut-tree-pewter-city-26-4",
    },
  ],
  trainers: [
  {
    npc: hiker,
    pokemon: [{ id: 56, level: 10 }],
    facing: Direction.Down,
    pos: { x: 15, y: 10 },
    intro: [],
    outtro: [
      "La BODEGA CASTILLO DE MONJARDÍN está ahí dentro.",
      "Sergio y Marta no dejan pasar a cualquiera.",
      "¡Demuestra lo que vales!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: jrTrainerMale,
    pokemon: [{ id: 23, level: 14 }, { id: 27, level: 13 }],
    facing: Direction.Left,
    pos: { x: 25, y: 10 },
    intro: [
      "¡Yo también quiero la Insignia del Vino!",
      "¡Pero como llegues tú antes, se acaba el cupo!",
      "¡Así que no te dejo pasar!"
    ],
    outtro: [
      "Está bien... supongo que te la has ganado."
    ],
    money: 250,
  },
  {
    npc: beauty,
    pokemon: [{ id: 35, level: 1 }],
    facing: Direction.Right,
    pos: { x: 8, y: 22 },
    intro: [],
    outtro: [
      "Si quieres ganar a Sergio y Marta,",
      "necesitas POKÉMON fuertes y buen vino.",
      "Lo del vino ya lo tienes... ¿y lo otro?"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: scientist,
    pokemon: [{ id: 100, level: 15 }, { id: 101, level: 14 }],
    facing: Direction.Down,
    pos: { x: 18, y: 22 },
    intro: [
      "¡Estoy analizando el terroir de MONJARDÍN!",
      "¡No me molestes... a menos que puedas con mis POKÉMON!"
    ],
    outtro: [
      "Sorprendente. El terroir de tu equipo también es excelente."
    ],
    money: 300,
  },
  {
    npc: aceTrainerMale,
    pokemon: [{ id: 58, level: 15 }],
    facing: Direction.Left,
    pos: { x: 28, y: 30 },
    intro: [],
    outtro: [
      "Sergio y Marta me dieron la Insignia del Vino el año pasado.",
      "Fue lo más difícil y lo más memorable de mi vida.",
      "¡Tú también puedes lograrlo!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 19, y: 6 },
    intro: [],
    outtro: [
      "Otro \"jefe\" metiendo presión?",
      "venga deja a los programadores trabajar!",
      "Vete a cascarla anda!"
    ],
    money: 0,
    persistent: true,
  }
  ],
}

export default pewterCity;
