import image from "../assets/map/route-22.png";
import { MapId, MapType } from "./map-types";

import getEncounterData from "./get-location-data";
import { fisher, lass, rival, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";
import { ItemType } from "../app/use-item-data";

const route22: MapType = {
  name: "Ruta 22",
  allowBicycle: true,
  image,
  height: 18,
  width: 40,
  start: {
    x: 38,
    y: 8,
  },
walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 36, 37, 38, 39],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 37, 38, 39],
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 37, 38, 39],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 37, 38, 39],
    5: [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15],
    6: [0, 1, 14, 15, 22, 23, 24, 25, 26, 27, 28, 29, 34, 35],
    7: [0, 1, 14, 15, 22, 23, 24, 25, 27, 28, 29, 34],
    8: [0, 1, 14, 15, 22, 23, 24, 25, 27, 28, 29, 34],
    9: [0, 1, 14, 15, 22, 23, 24, 25, 27, 28, 29, 34],
    10: [0, 1, 14, 15, 27, 28, 29, 34, 38, 39],
    11: [0, 1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 27, 28, 29, 34, 39],
    12: [0, 1, 27, 28, 29, 39],
    13: [0, 1, 39],
    14: [0, 1, 39],
    15: [0, 1, 39],
    16: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
  },
  fenceDirections: {
    0: { 14: Direction.Left },
    1: { 14: Direction.Left, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 35: Direction.Down },
    2: { 14: Direction.Left, 36: Direction.Left },
    3: { 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 34: Direction.Down, 35: Direction.Down, 36: Direction.Left },
    4: { 36: Direction.Left },
    5: { 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down },
    7: { 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 26: Direction.Left, 30: Direction.Down, 32: Direction.Down, 33: Direction.Down },
    8: { 26: Direction.Left },
    9: { 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 10: Direction.Down, 12: Direction.Down, 13: Direction.Down, 26: Direction.Left },
    10: { 26: Direction.Left },
    11: { 26: Direction.Left, 38: Direction.Left },
    12: { 26: Direction.Left, 38: Direction.Left },
    13: { 2: Direction.Down, 3: Direction.Down, 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 10: Direction.Down, 11: Direction.Down, 12: Direction.Down, 13: Direction.Down, 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Down, 21: Direction.Down, 22: Direction.Down, 23: Direction.Down, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 34: Direction.Down, 35: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Left },
    14: { 38: Direction.Left },
    15: { 38: Direction.Left },
  },
  fences: {
    0: [14],
    1: [14, 30, 31, 32, 33, 34, 35],
    2: [14, 36],
    3: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36],
    4: [36],
    5: [36, 37, 38, 39],
    7: [16, 17, 18, 19, 20, 21, 26, 30, 32, 33],
    8: [26],
    9: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 26],
    10: [26],
    11: [26, 38],
    12: [26, 38],
    13: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 34, 35, 36, 37, 38],
    14: [38],
    15: [38],
  },
  text: {
    11: {
      7: [
        "RUTA 22: La ruta del desafío.",
        "¡Solo los fuertes merecen bailar!",
      ],
    },
  },
  maps: {
    0: { 14: MapId.Route23 },
    5: { 39: MapId.ViridianCity },
    6: { 39: MapId.ViridianCity },
    7: { 39: MapId.ViridianCity },
    8: { 39: MapId.ViridianCity },
    9: { 39: MapId.ViridianCity },
  },
  teleports: {
    // Puerta de la Caseta de Control (edificio noroeste) → camino a la liga
    5: { 8: { map: MapId.GateHouse, pos: { x: 4, y: 6 } } },
  },
  exits: {

  },
  grass: {
    8: [16, 17, 18, 19, 20, 21, 30, 31, 32, 33],
    9: [16, 17, 18, 19, 20, 21, 30, 31, 32, 33],
    10: [16, 17, 18, 19, 20, 21, 30, 31, 32, 33],
    11: [16, 17, 18, 19, 20, 21, 30, 31, 32, 33],
  },
  water: {
    6: [22, 23, 24, 25],
    7: [22, 23, 24, 25],
    8: [22, 23, 24, 25],
    9: [22, 23, 24, 25],
  },

  exitReturnMap: MapId.ViridianCity,
  exitReturnPos: {
    x: 1,
    y: 16,
  },
// Trainers para "route-22"
// Trainers para "route-22"
// Trainers para "route-22"
trainers: [
  {
  npc: rival,
  pokemon: [{ id: 2, level: 12 }, { id: 8, level: 12 }, { id: 5, level: 12 }],
  facing: Direction.Right,
  pos: { x: 26, y: 5 },
  intro: [
    "¡Ey!",
    "¿Vas a la LIGA PKMN?",
    "¡Ni lo sueñes! ¡Seguro que no tienes ninguna MEDALLA!",
    "¡El guardia no te dejará pasar!",
    "Por cierto, ¿tus PKMN se han hecho más fuertes?",
    "Pero que dices de una boda?"
  ],
  outtro: [
    "¡Vaya suerte la tuya!",
    "Con lo tajao que parece que vas"
  ],
  money: 280,
  persistent: true,
},
  {
  npc: youngster,
  pokemon: [{ id: 32, level: 8 }, { id: 21, level: 9 }],
  facing: Direction.Right,
  pos: { x: 16, y: 11 },
  intro: [
    "¡Yo también voy a la preboda!",
    "¡Pero como solo hay un sitio libre en la mesa,",
    "¡tendrás que ganártelo!"
  ],
  outtro: [
    "Está bien... disfruta del banquete."
  ],
  money: 160,
  persistent: true,
},
  {
  npc: lass,
  pokemon: [{ id: 29, level: 8 }, { id: 19, level: 8 }],
  facing: Direction.Down,
  pos: { x: 9, y: 6 },
  intro: [
    "Este camino lleva al lago de los novios.",
    "¡Nadie que no sepa luchar puede cruzarlo!"
  ],
  outtro: [
    "¡Bonito equipo! Te han guardado sitio en el banquete."
  ],
  money: 120,
  persistent: true,
},
  {
  npc: fisher,
  pokemon: [{ id: 60, level: 8 }, { id: 98, level: 10 }, { id: 116, level: 12 }],
  facing: Direction.Left,
  pos: { x: 35, y: 2 },
  intro: [
    "El hermano del novio me ha dejado custodiando este objeto.",
    "No permitiré que lo roben!"
  ],
  outtro: [
    "En realidad, creo que ha ido a por otra caña mejor",
    "que le pueda servir para pescar algo en la boda."
  ],
  money: 200,
  persistent: true,
}
],
encounters: {
  walk: {
    rate: 21,
    pokemon: [
      { id: 19, chance: 20, conditionValues: [], minLevel: 3, maxLevel: 3 },
      { id: 19, chance: 15, conditionValues: [], minLevel: 4, maxLevel: 4 },
      { id: 19, chance: 10, conditionValues: [], minLevel: 2, maxLevel: 2 },
      { id: 21, chance: 5, conditionValues: [], minLevel: 3, maxLevel: 3 },
      { id: 21, chance: 5, conditionValues: [], minLevel: 5, maxLevel: 5 },
      { id: 29, chance: 20, conditionValues: [], minLevel: 3, maxLevel: 3 },
      { id: 29, chance: 10, conditionValues: [], minLevel: 4, maxLevel: 4 },
      { id: 29, chance: 10, conditionValues: [], minLevel: 2, maxLevel: 2 },
      { id: 32, chance: 4, conditionValues: [], minLevel: 3, maxLevel: 3 },
      { id: 32, chance: 1, conditionValues: [], minLevel: 4, maxLevel: 4 },
      { id: 56, chance: 10, conditionValues: [], minLevel: 4, maxLevel: 7 }
    ],
  },
  surf: { rate: 0, pokemon: [] },
  oldRod: {
    rate: 20,
    pokemon: [
      { id: 129, chance: 100, conditionValues: [], minLevel: 5, maxLevel: 5 }
    ],
  },
  goodRod: {
    rate: 20,
    pokemon: [
      { id: 60, chance: 50, conditionValues: [], minLevel: 9, maxLevel: 11 },
      { id: 118, chance: 50, conditionValues: [], minLevel: 10, maxLevel: 10 },
      { id: 98, chance: 10, conditionValues: [], minLevel: 7, maxLevel: 7 },
      { id: 129, chance: 10, conditionValues: [], minLevel: 5, maxLevel: 5 },
      { id: 90, chance: 10, conditionValues: [], minLevel: 9, maxLevel: 9 }
    ],
  },
  superRod: {
    rate: 20,
    pokemon: [
      { id: 60, chance: 17, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 60, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 60, chance: 25, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 118, chance: 25, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 118, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 118, chance: 17, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 86, chance: 10, conditionValues: [], minLevel: 12, maxLevel: 14 },
      { id: 131, chance: 5, conditionValues: [], minLevel: 20, maxLevel: 20 }
    ],
  },
  rockSmash: { rate: 0, pokemon: [] }, headbutt: { rate: 0, pokemon: [] }, darkGrass: { rate: 0, pokemon: [] },
  grassSpots: { rate: 0, pokemon: [] }, caveSpots: { rate: 0, pokemon: [] }, bridgeSpots: { rate: 0, pokemon: [] },
  superRodSpots: { rate: 0, pokemon: [] }, surfSpots: {
    rate: 100,
    pokemon: [
      { id: 55, chance: 9, conditionValues: [], minLevel: 28, maxLevel: 30 },
      { id: 131, chance: 7, conditionValues: [], minLevel: 30, maxLevel: 32 },
      { id: 119, chance: 12, conditionValues: [], minLevel: 20, maxLevel: 25 },
      { id: 129, chance: 12, conditionValues: [], minLevel: 19, maxLevel: 23 },
      { id: 130, chance: 6, conditionValues: [], minLevel: 30, maxLevel: 33 }
    ],
  },
  yellowFlowers: { rate: 0, pokemon: [] }, purpleFlowers: { rate: 0, pokemon: [] }, redFlowers: { rate: 0, pokemon: [] },
  roughTerrain: { rate: 0, pokemon: [] }, gift: { rate: 0, pokemon: [] }, giftEgg: { rate: 0, pokemon: [] }, onlyOne: { rate: 0, pokemon: [] },
},
items: [
    {
      item: ItemType.GoodRod,
      pos: { x: 30, y: 2 },
    },
  ],
  minimapPos: { x: 30, y: 116 },
};

export default route22;
