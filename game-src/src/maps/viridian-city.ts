import viridianCityImage from "../assets/map/viridian-city.png";
import { MapId, MapType } from "./map-types";
import { cueBall, fisher, gentleman, jrTrainerFemale, lass, rocker, sailor, teamRocketGrunt } from "../app/npcs";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/pallet-town.mp3";
import getEncounterData from "./get-location-data";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/viridian-city.png";

const viridianCity: MapType = {
  name: "SOTO LEZKAIRU",
  allowBicycle: true,
  image,
  music: music,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 36, 37, 38, 39],
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 36, 37, 38, 39],
    4: [0, 1, 2, 3, 4, 5, 14, 28, 29, 30, 31, 32, 33, 36, 37, 38, 39],
    5: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 28, 29, 30, 31, 32, 33, 36, 37, 38, 39],
    6: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 28, 29, 30, 31, 32, 33, 36, 37, 38, 39],
    7: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 27, 28, 29, 30, 31, 33, 36, 37, 38, 39],
    8: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 36, 37, 38, 39],
    9: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 22, 23, 36, 37, 38, 39],
    10: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 36, 37, 38, 39],
    11: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 36, 37, 38, 39],
    12: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 36, 37, 38, 39],
    13: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    14: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 36, 37, 38, 39],
    15: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 22, 23, 36, 37, 38, 39],
    16: [8, 9, 10, 11, 12, 13, 14, 15, 28, 29, 30, 31, 36, 37, 38, 39],
    17: [17, 20, 21, 22, 23, 28, 29, 30, 31, 36, 37, 38, 39],
    18: [0, 1, 2, 3, 28, 29, 30, 31, 36, 37, 38, 39],
    19: [0, 1, 2, 3, 28, 30, 31, 36, 37, 38, 39],
    20: [0, 1, 2, 3, 36, 37, 38, 39],
    21: [0, 1, 2, 3, 4, 5, 6, 7, 36, 37, 38, 39],
    22: [0, 1, 2, 3, 8, 22, 23, 24, 25, 36, 37, 38, 39],
    23: [0, 1, 2, 3, 8, 9, 22, 23, 24, 25, 36, 37, 38, 39],
    24: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 22, 23, 24, 25, 36, 37, 38, 39],
    25: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 22, 24, 25, 36, 37, 38, 39],
    26: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 36, 37, 38, 39],
    27: [8, 9, 10, 11, 12, 13, 36, 37, 38, 39],
    28: [3, 36, 37, 38, 39],
    29: [3, 21, 36, 37, 38, 39],
    30: [3, 36, 37, 38, 39],
    31: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    32: [13, 19, 22, 28],
    33: [13, 19, 22, 28],
    34: [13, 19, 22, 28],
    35: [13, 19, 22, 28],
  },
  fenceDirections: {
    9: { 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 35: Direction.Down },
    13: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down },
    27: { 0: Direction.Down, 1: Direction.Down, 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 14: Direction.Down, 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 35: Direction.Down },
  },
    boulders: [
    {
      pos: { x: 32, y: 14 },
      id: "boulder-viridian-city-32-14",
    },
    {
      pos: { x: 32, y: 15 },
      id: "boulder-viridian-city-32-15",
    },
    {
      pos: { x: 32, y: 16 },
      id: "boulder-viridian-city-32-16",
    },
    {
      pos: { x: 33, y: 16 },
      id: "boulder-viridian-city-33-16",
    },
    {
      pos: { x: 34, y: 16 },
      id: "boulder-viridian-city-34-16",
    },
    {
      pos: { x: 35, y: 16 },
      id: "boulder-viridian-city-35-16",
    },
  ],
  fences: {
    9: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    13: [0, 1, 2, 3, 4, 5],
    27: [0, 1, 2, 3, 4, 5, 6, 7, 14, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  },
  grass: {},
  water: {
    24: [8, 9, 10, 11, 12, 13],
    25: [8, 9, 10, 11, 12, 13],
    26: [8, 9, 10, 11, 12, 13],
    27: [8, 9, 10, 11, 12, 13],
  },
  text: {
    1: {
      19: [
        "RUTA 2 · Hacia VILLAMAYOR →"
      ],
    },
    7: {
      27: [
        "RINCÓN DE PENSAR. Lugar abandonado. Antiguo emplazamiento para quedada de cuadrillas"
      ],
    },
    17: {
      17: [
        "AVISO: Reserva de vino protegida.",
        "Manos fuera, Team Rocket."
      ],
    },
    19: {
      30: [
        "¡Que vivan los novios!",
        "¡Y que el anís no falte!"
      ],
    },
    25: {
      24: [
        "En el Soto, el vino corre más que el agua."
      ],
    },
    29: {
      21: [
        "¡SOTO LEZKAIRU!",
        "Bienvenido al glamour."
      ],
    },
  },
  maps: {
    0: { 17: MapId.Route2, 18: MapId.Route2, 19: MapId.Route2 },
    7: { 32: MapId.ViridianCityGym },
    9: { 21: MapId.ViridianCityNpcHouse },
    13: { 0: MapId.Route22 },
    14: { 0: MapId.Route22 },
    15: { 0: MapId.Route22, 21: MapId.ViridianCityPokemonAcadamy },
    16: { 0: MapId.Route22 },
    17: { 0: MapId.Route22 },
    19: { 29: MapId.ViridianCityPokeMart },
    25: { 23: MapId.ViridianCityPokemonCenter },
    27: { 0: MapId.Route22 },
    28: { 0: MapId.Route22 },
    29: { 0: MapId.Route22 },
    30: { 0: MapId.Route22 },
    31: { 0: MapId.Route22 },
    32: { 0: MapId.Route22 },
    33: { 0: MapId.Route22 },
    34: { 0: MapId.Route22 },
    35: { 0: MapId.Route22, 1: MapId.Route1, 2: MapId.Route1, 3: MapId.Route1, 4: MapId.Route1, 5: MapId.Route1, 6: MapId.Route1, 7: MapId.Route1, 8: MapId.Route1, 9: MapId.Route1, 10: MapId.Route1, 11: MapId.Route1, 12: MapId.Route1, 14: MapId.Route1, 15: MapId.Route1, 16: MapId.Route1, 17: MapId.Route1, 18: MapId.Route1, 20: MapId.Route1, 21: MapId.Route1, 23: MapId.Route1, 24: MapId.Route1, 25: MapId.Route1, 26: MapId.Route1, 27: MapId.Route1, 29: MapId.Route1, 30: MapId.Route1, 31: MapId.Route1, 32: MapId.Route1, 33: MapId.Route1, 34: MapId.Route1, 35: MapId.Route1, 36: MapId.Route1, 37: MapId.Route1, 38: MapId.Route1, 39: MapId.Route1 },
  },
  exits: {

  },
  exitReturnMap: MapId.Route1,
  exitReturnPos: { x: 11, y: 1 },
  recoverLocation: { x: 23, y: 26 },
  encounters: {
    walk: {
      rate: 0,
      pokemon: [

      ],
    },
    surf: { rate: 0, pokemon: [] },
    oldRod: {
      rate: 10,
      pokemon: [
        { id: 129, chance: 100, conditionValues: [], minLevel: 5, maxLevel: 5 }
      ],
    },
    goodRod: {
      rate: 10,
      pokemon: [
        { id: 60, chance: 50, conditionValues: [], minLevel: 10, maxLevel: 11 },
        { id: 118, chance: 50, conditionValues: [], minLevel: 10, maxLevel: 12 },
        { id: 129, chance: 61, conditionValues: [], minLevel: 5, maxLevel: 6 },
        { id: 116, chance: 14, conditionValues: [], minLevel: 8, maxLevel: 9 },
        { id: 120, chance: 35, conditionValues: [], minLevel: 8, maxLevel: 9 },
        { id: 147, chance: 10, conditionValues: [], minLevel: 10, maxLevel: 11 }
      ],
    },
    superRod: {
      rate: 10,
      pokemon: [
        { id: 60, chance: 17, conditionValues: [], minLevel: 15, maxLevel: 15 },
        { id: 60, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
        { id: 79, chance: 25, conditionValues: [], minLevel: 15, maxLevel: 20 },
        { id: 72, chance: 25, conditionValues: [], minLevel: 15, maxLevel: 15 },
        { id: 72, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
        { id: 54, chance: 17, conditionValues: [], minLevel: 15, maxLevel: 15 }
      ],
    },
    rockSmash: { rate: 0, pokemon: [] }, headbutt: { rate: 0, pokemon: [] }, darkGrass: { rate: 0, pokemon: [] },
    grassSpots: { rate: 0, pokemon: [] }, caveSpots: { rate: 0, pokemon: [] }, bridgeSpots: { rate: 0, pokemon: [] },
    superRodSpots: { rate: 0, pokemon: [] }, surfSpots: {
      rate: 100,
      pokemon: [
        { id: 54, chance: 10, conditionValues: [], minLevel: 18, maxLevel: 25 },
        { id: 130, chance: 5, conditionValues: [], minLevel: 25, maxLevel: 30 },
        { id: 138, chance: 10, conditionValues: [], minLevel: 20, maxLevel: 24 },
        { id: 134, chance: 3, conditionValues: [], minLevel: 20, maxLevel: 30 },
        { id: 140, chance: 10, conditionValues: [], minLevel: 20, maxLevel: 24 }
      ],
    },
    yellowFlowers: { rate: 0, pokemon: [] }, purpleFlowers: { rate: 0, pokemon: [] }, redFlowers: { rate: 0, pokemon: [] },
    roughTerrain: { rate: 0, pokemon: [] }, gift: { rate: 0, pokemon: [] }, giftEgg: { rate: 0, pokemon: [] }, onlyOne: { rate: 0, pokemon: [] },
  },
  items: [
    {
      item: ItemType.MasterBall,
      pos: { x: 5, y: 23 },
    },
  ],
  staticPokemon: [
    {
      pokemonId: 175,
      level: 5,
      sprite: "cute-a",
      pos: { x: 12, y: 4 },
      questId: "viridian-city-static-12-4",
      intro: [
        "Priiii",
      ],
    },
  ],
  cuttableTrees: [
    {
      pos: { x: 7, y: 22 },
      questId: "cut-tree-viridian-city-7-22",
    },
    {
      pos: { x: 15, y: 4 },
      questId: "cut-tree-viridian-city-15-4",
    },
  ],
  trainers: [
  {
    npc: cueBall,
    pokemon: [{ id: 19, level: 6 }],
    facing: Direction.Down,
    pos: { x: 12, y: 20 },
    intro: [
      "¡Hemos montado nuestra propia preboda!",
      "¡Con vino barato y sin protocolo!",
      "¡Demuestra que mereces el bueno!"
    ],
    outtro: [
      "...igual el vino caro tampoco está tan mal."
    ],
    money: 80,
    persistent: true,
  },
  {
    npc: jrTrainerFemale,
    pokemon: [{ id: 41, level: 7 }],
    facing: Direction.Right,
    pos: { x: 26, y: 24 },
    intro: [
      "¡Nosotros también queremos brindar!",
      "¡Pero solo si nos ganas!"
    ],
    outtro: [
      "¡Felicidades! ¡Brindamos juntos el 8 de agosto!"
    ],
    money: 100,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 33, level: 7 }, { id: 52, level: 6 }],
    facing: Direction.Down,
    pos: { x: 19, y: 12 },
    intro: [
      "¡Con este vino seremos los reyes de la fiesta!",
      "¡No te metas en nuestros asuntos!"
    ],
    outtro: [
      "¡Maldición! Nos retiramos... pero volveremos por el anís."
    ],
    money: 200,
    persistent: true,
    sightRange: 4,
  },
  {
    npc: gentleman,
    pokemon: [{ id: 1, level: 1 }],
    facing: Direction.Down,
    pos: { x: 27, y: 22 },
    intro: [],
    outtro: [
      "Joven, el vino tinto cura... y anima.",
      "Toma una botella para el camino.",
      "¡Salud!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: rocker,
    pokemon: [{ id: 25, level: 1 }],
    facing: Direction.Right,
    pos: { x: 18, y: 8 },
    intro: [],
    outtro: [
      "¡El equipo de sonido ya está enchufado!",
      "¡En cuanto lleguen los novios, esto se lía!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: lass,
    pokemon: [{ id: 35, level: 3 }],
    facing: Direction.Left,
    pos: { x: 9, y: 4 },
    intro: [],
    outtro: [
      "Llegué la primera. Esta silla ya tiene dueña.",
      "¡A ver si venís más tarde!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: sailor,
    pokemon: [{ id: 54, level: 5 }],
    facing: Direction.Left,
    pos: { x: 20, y: 21 },
    intro: [],
    outtro: [
      "¡Quieto! ¡Esto es para las fotos del álbum!",
      "¡La luz aquí es perfecta!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: fisher,
    pokemon: [{ id: 118, level: 7 }, { id: 129, level: 6 }],
    facing: Direction.Down,
    pos: { x: 15, y: 30 },
    intro: [
      "¡No sé dónde es la preboda!",
      "¡Y encima tú te has metido en mi camino!"
    ],
    outtro: [
      "Gracias... Creo que es por aquí."
    ],
    money: 60,
    persistent: true,
  }
  ],
  minimapPos: { x: 52, y: 112 },
  flyable: true,
  flySpot: { x: 23, y: 26 },
}

export default viridianCity;
