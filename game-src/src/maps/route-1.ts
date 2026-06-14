import route1Image from "../assets/map/route-1.png";
import { MapId, MapType } from "./map-types";
import { beauty, fisher, lass, sailor, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/route-1.mp3";
import getEncounterData from "./get-location-data";
import { ItemType } from "../app/use-item-data";

const route1: MapType = {
  name: "Ruta 1 · Camino al Soto",
  allowBicycle: true,
  image: route1Image,
  music: music,
  height: 36,
  width: 20,
  start: { x: 11, y: 34 },
  walls: {
    0: [9, 12],
    1: [3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18],
    2: [3, 18],
    3: [3, 18],
    4: [3, 9, 18],
    5: [3, 9, 18],
    6: [3, 9, 18],
    7: [3, 9, 18],
    8: [3, 9, 18],
    9: [3, 9, 18],
    10: [3, 18],
    11: [3, 18],
    12: [3, 18],
    13: [3, 4, 5, 10, 11, 12, 13, 18],
    14: [3, 18],
    15: [3, 18],
    16: [3, 18],
    17: [3, 18],
    18: [3, 18],
    19: [3, 18],
    20: [3, 18],
    21: [3, 18],
    22: [3, 18],
    23: [3, 4, 5, 6, 7, 8, 9, 10, 11, 18],
    24: [3, 18],
    25: [3, 18],
    26: [3, 18],
    27: [3, 9, 18],
    28: [3, 18],
    29: [3, 18],
    30: [3, 18],
    31: [3, 18],
    32: [3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18],
    33: [9, 12],
    34: [9, 12],
    35: [9, 12],
  },
    berryTrees: [
    {
      pos: { x: 6, y: 7 },
      item: ItemType.Berry,
    },
  ],
  fences: {
    5: [4, 5, 6, 7, 8, 10, 11, 12, 13],
    9: [4, 5, 6, 7, 8],
    13: [6, 7, 8, 9],
    19: [4, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 17],
    23: [16, 17],
    27: [4, 5, 10, 11, 12, 13, 14, 15, 16, 17],
  },
  grass: {
    6: [10, 11, 12, 13, 14, 15, 16, 17],
    7: [10, 11, 12, 13, 14, 15, 16, 17],
    8: [10, 11, 12, 13, 14, 15, 16, 17],
    9: [10, 11, 12, 13, 14, 15, 16, 17],
    12: [14, 15, 16, 17],
    13: [14, 15, 16, 17],
    14: [14, 15, 16, 17],
    15: [14, 15, 16, 17],
    22: [12, 13, 14, 15],
    23: [12, 13, 14, 15],
    24: [12, 13, 14, 15],
    25: [12, 13, 14, 15],
    28: [6, 7, 8, 9, 14, 15, 16, 17],
    29: [6, 7, 8, 9, 14, 15, 16, 17],
    30: [4, 5, 6, 7, 12, 13, 14, 15],
    31: [4, 5, 6, 7, 12, 13, 14, 15],
    32: [10, 11],
    33: [10, 11],
    34: [10, 11],
  },
  text: {
    27: {
      9: [
        "RUTA 1 · Camino al Soto",
        "¡Sigue el sendero del amor!",
        "La preboda te espera al final del camino."
      ],
    },
  },
  maps: {
    0: {
      10: MapId.ViridianCity,
      11: MapId.ViridianCity,
    },
  },
  exits: {
    35: [10, 11],
  },
  exitReturnMap: MapId.PalletTown,
  exitReturnPos: { x: 10, y: 2 },
  encounters: {
    walk: {
      rate: 21,
      pokemon: [
        { id: 16, chance: 20, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 16, chance: 10, conditionValues: [], minLevel: 2, maxLevel: 2 },
        { id: 16, chance: 10, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 16, chance: 5, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 16, chance: 4, conditionValues: [], minLevel: 4, maxLevel: 4 },
        { id: 16, chance: 1, conditionValues: [], minLevel: 5, maxLevel: 5 },
        { id: 19, chance: 20, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 19, chance: 15, conditionValues: [], minLevel: 3, maxLevel: 3 },
        { id: 19, chance: 10, conditionValues: [], minLevel: 2, maxLevel: 2 },
        { id: 19, chance: 5, conditionValues: [], minLevel: 4, maxLevel: 4 }
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
  trainers: [
  {
    npc: youngster,
    pokemon: [{ id: 21, level: 4 }],
    facing: Direction.Left,
    pos: { x: 14, y: 18 },
    intro: [
      "¡Para ahí, tú!",
      "¡No te creas que llegarás tan fácil!",
      "¡Yo quería el vino y tú me lo quitaste!"
    ],
    outtro: [
      "Bueno... puede que yo tampoco llegue a tiempo."
    ],
    money: 50,
    persistent: true,
  },
  {
    npc: beauty,
    pokemon: [{ id: 35, level: 2 }],
    facing: Direction.Right,
    pos: { x: 7, y: 20 },
    intro: [],
    outtro: [
      "¡No olvides que la preboda sin anís no es preboda!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: lass,
    pokemon: [{ id: 19, level: 6 }],
    facing: Direction.Down,
    pos: { x: 13, y: 10 },
    intro: [],
    outtro: [
      "¡El coche de los novios ya ha salido de Pamplona!",
      "¡Muévete o te quedas sin sitio!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: fisher,
    pokemon: [{ id: 129, level: 7 }, { id: 118, level: 5 }],
    facing: Direction.Left,
    pos: { x: 13, y: 26 },
    intro: [
      "¡Yo pensaba que la preboda era en el río!",
      "¡Pues aun así, a ver si me ganas!"
    ],
    outtro: [
      "Bueno... en fin. Al menos el vino no estará en el río."
    ],
    money: 70,
    persistent: true,
  },
  {
    npc: sailor,
    pokemon: [{ id: 72, level: 5 }, { id: 54, level: 6 }],
    facing: Direction.Down,
    pos: { x: 6, y: 16 },
    intro: [
      "¡El padrino me manda a probarte!",
      "¡Si llegas tarde, él no responde!"
    ],
    outtro: [
      "Pasa, pasa. El padrino estará orgulloso."
    ],
    money: 90,
    persistent: true,
  }
  ],
  minimapPos: { x: 54, y: 135 },
}

export default route1;
