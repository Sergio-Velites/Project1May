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
    1: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    2: [0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 35, 36, 37, 38, 39],
    3: [0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 35, 36, 37, 38, 39],
    4: [0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 26, 35, 36, 37, 38, 39],
    5: [0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 26, 27, 35, 36, 37, 38, 39],
    6: [0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17, 27, 35, 36, 37, 38, 39],
    7: [0, 1, 2, 3, 10, 11, 12, 13, 15, 16, 17, 27, 35, 36, 37, 38, 39],
    8: [0, 1, 2, 3, 35, 36, 37, 38, 39],
    9: [0, 1, 2, 3, 15, 35, 36, 37, 38, 39],
    10: [0, 1, 2, 3, 34, 35, 36, 37, 38, 39],
    11: [0, 1, 2, 3, 35, 36, 37, 38, 39],
    12: [0, 1, 2, 3, 28, 29, 30, 31, 35, 36, 37, 38, 39],
    13: [0, 1, 2, 3, 28, 30, 31, 35, 36, 37, 38, 39],
    14: [0, 1, 2, 3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 35, 36, 37, 38, 39],
    15: [0, 1, 2, 3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25],
    16: [0, 1, 2, 3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25],
    17: [0, 1, 2, 3, 11, 12, 13, 14, 15, 17, 22, 24, 25],
    18: [0, 1, 2, 3, 18],
    19: [0, 1, 2, 3, 18, 33],
    20: [0, 1, 2, 3, 18, 34, 35, 36, 37, 38, 39],
    21: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 35, 36, 37, 38, 39],
    22: [0, 1, 2, 3, 12, 13, 14, 15, 35, 36, 37, 38, 39],
    23: [0, 1, 2, 3, 12, 13, 14, 15, 22, 23, 24, 25, 26, 27, 28, 29, 35, 36, 37, 38, 39],
    24: [0, 1, 2, 3, 12, 13, 14, 15, 21, 30, 35, 36, 37, 38, 39],
    25: [0, 1, 2, 3, 12, 14, 15, 21, 30],
    26: [0, 1, 2, 3, 21, 30, 35],
    27: [0, 1, 2, 3, 21, 30, 35],
    28: [0, 1, 2, 3, 6, 7, 8, 9, 21, 30, 35],
    29: [0, 1, 6, 8, 9, 19, 21, 30, 35],
    30: [0, 1, 2, 3, 35],
    31: [0, 1, 2, 3, 35],
    32: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    33: [12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25],
    34: [12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25],
    35: [12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25],
  },
  fenceDirections: {
    7: { 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 8: Direction.Down, 9: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down },
    11: { 34: Direction.Left },
    12: { 34: Direction.Left },
    13: { 34: Direction.Left },
    14: { 34: Direction.Left },
    15: { 34: Direction.Down, 35: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down },
    21: { 34: Direction.Left },
    22: { 34: Direction.Left },
    23: { 34: Direction.Left },
    24: { 34: Direction.Left },
    25: { 34: Direction.Down, 35: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down },
    29: { 2: Direction.Down, 3: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down },
    33: { 0: Direction.Down, 1: Direction.Down },
  },
  fences: {
    7: [4, 5, 6, 8, 9, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 32, 33, 34],
    11: [34],
    12: [34],
    13: [34],
    14: [34],
    15: [34, 35, 36, 37, 38, 39],
    21: [34],
    22: [34],
    23: [34],
    24: [34],
    25: [34, 35, 36, 37, 38, 39],
    29: [2, 3, 22, 23, 24, 26, 27, 28, 29],
    33: [0, 1],
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
  maps: {
    5: { 19: MapId.PewterCityNpcA },
    7: { 14: MapId.PewterCityNpcA },
    13: { 29: MapId.PewterCityNpcB },
    15: { 39: MapId.Route3 },
    16: { 39: MapId.Route3 },
    17: { 16: MapId.PewterCityGym, 23: MapId.PewterCityPokeMart, 39: MapId.Route3 },
    18: { 39: MapId.Route3 },
    19: { 39: MapId.Route3 },
    25: { 13: MapId.PewterCityPokemonCenter, 39: MapId.Route3 },
    26: { 39: MapId.Route3 },
    27: { 39: MapId.Route3 },
    28: { 39: MapId.Route3 },
    29: { 39: MapId.Route3 },
    30: { 39: MapId.Route3 },
    31: { 39: MapId.Route3 },
    32: { 39: MapId.Route3 },
    33: { 39: MapId.Route3 },
    34: { 39: MapId.Route3 },
    35: { 18: MapId.Route2, 19: MapId.Route2, 26: MapId.Route2, 27: MapId.Route2, 28: MapId.Route2, 29: MapId.Route2, 30: MapId.Route2, 31: MapId.Route2, 32: MapId.Route2, 33: MapId.Route2, 34: MapId.Route2, 35: MapId.Route2, 36: MapId.Route2, 37: MapId.Route2, 38: MapId.Route2, 39: MapId.Route3 },
  },
  teleports: {

  },
  exits: {

  },
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
  minimapPos: { x: 54, y: 52 },
  flyable: true,
  flySpot: { x: 13, y: 26 },
}

export default pewterCity;
