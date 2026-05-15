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
    1: [30, 31, 32, 33, 34, 35, 36],
    2: [29, 36],
    3: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 36],
    4: [8, 15, 36],
    5: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 15, 36, 37, 38, 39],
    6: [1, 14, 15, 26, 27, 28, 29, 34, 35],
    7: [1, 14, 15, 29, 34],
    8: [1, 14, 15, 29, 34],
    9: [1, 14, 15, 29, 34],
    10: [1, 14, 15, 26, 29, 34, 38, 39],
    11: [1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 26, 29, 34, 38],
    12: [1, 26, 29, 38],
    13: [1, 26, 27, 28, 29, 38],
    14: [1, 38],
    15: [1, 38],
    16: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37],
  },
  fences: {
    3: [30, 31, 32, 34, 35],
    7: [16, 17, 18, 19, 20, 21, 30, 32, 33],
    9: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13],
    13: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 30, 31, 32, 34, 35, 36, 37,
    ],
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
    5: {
      8: MapId.GateHouse,
    },
  },
  exits: {
    6: [39],
    7: [39],
    8: [39],
    9: [39],
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
      { id: 60, chance: 50, conditionValues: [], minLevel: 9, maxLevel: 98 },
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
};

export default route22;
