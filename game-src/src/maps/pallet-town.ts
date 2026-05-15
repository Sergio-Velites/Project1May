import palletTownImage from "../assets/map/pallet-town.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import { lass, youngster, teamRocketGrunt } from "../app/npcs";

import music from "../assets/music/maps/pallet-town.mp3";
import getEncounterData from "./get-location-data";

const palletTown: MapType = {
  name: "PUEBLO PALETA",
  allowBicycle: true,
  image: palletTownImage,
  height: 18,
  width: 20,
  start: {
    x: 8,
    y: 13,
  },
walls: {
    0: [9, 12],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19],
    2: [0, 19],
    3: [0, 4, 5, 6, 7, 12, 13, 14, 15, 19],
    4: [0, 4, 5, 6, 7, 12, 13, 14, 15, 19],
    5: [0, 3, 4, 6, 7, 11, 12, 14, 15, 19],
    6: [0, 19],
    7: [0, 19],
    8: [0, 4, 10, 11, 12, 13, 14, 15, 19],
    9: [0, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 19],
    10: [0, 10, 11, 12, 13, 14, 15, 19],
    11: [0, 10, 11, 13, 14, 15, 19],
    12: [0, 19],
    13: [0, 10, 11, 12, 13, 14, 15, 19],
    14: [0, 19],
    15: [0, 10, 19],
    16: [0, 19],
    17: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    18: [4, 5, 6, 7],
  },
  text: {
    5: {
      3: ["Tu casa. Volver a dormir no es una opción ahora."],
      11: ["Casa de Chun Su. Hoy no hay nadie."],
    },
    9: {
      7: ["PUEBLO PALETA. Como tu de paleto."],
    },
    13: {
      13: ["DESTILERÍA DEL PROF. OAK"],
    },
    15: {
      10: [
        "Dicen que hay un tal JUANRE que no perdona a los rezajados",
        "Habrá que que ponerse en marcha...",
        "Dicen que la preboda es en EL BOSQUECILLO",
      ],
    },
    8: {
      4: [
        "Pensé que me invitarían...",
      ],
    },
  },
  maps: {
    5: {
      5: MapId.PalletTownHouseA1F,
      13: MapId.PalletTownHouseB,
    },
    11: {
      12: MapId.PalletTownLab,
    },
    0: {
      10: MapId.Route1,
      11: MapId.Route1,
    },
  },
  exits: {},
  music,
  grass: {},
  recoverLocation: { x: 5, y: 6 },
  // NPCs del pueblo con los que se puede hablar (no combaten):
// Trainers para "pallet-town"
// Trainers para "pallet-town"
trainers: [
  {
  npc: youngster,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Up,
  pos: { x: 5, y: 7 },
  intro: [

  ],
  outtro: [
    "Hoy noto como un cancaneo por mi cuerpo.",
    "Parece que algo gordo se avecina!"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: lass,
  pokemon: [{ id: 35, level: 3 }],
  facing: Direction.Down,
  pos: { x: 15, y: 6 },
  intro: [

  ],
  outtro: [
    "Me voy a poner como el kiko en la preboda.",
    "Dicen que hay que llegar hasta EL BOSQUECILLO,",
    "pero merecerá la pena."
  ],
  money: 0,
  persistent: true,
},
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Right,
  pos: { x: 10, y: 0 },
  intro: [

  ],
  outtro: [
    "Viva el vino!",
    "Hip! ¡Aquí no pasa nadie sin un POKEMON!",
    "Hip! Habla con el borracho Oak y ",
    "que te de uno, hip!",
    "antes de que se los beba todos, hip!"
  ],
  money: 0,
  persistent: true,
  hideCondition: "has-pokemon",
},
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Left,
  pos: { x: 11, y: 0 },
  intro: [

  ],
  outtro: [
    "Viva el vino!",
    "Hip! ¡Aquí no pasa nadie sin un POKEMON!",
    "Hip! Habla con el borracho Oak y ",
    "que te de uno, hip!",
    "antes de que se los beba todos, hip!"
  ],
  money: 0,
  persistent: true,
  hideCondition: "has-pokemon",
}
],
water: {
    14: [4, 5, 6, 7],
    15: [4, 5, 6, 7],
    16: [4, 5, 6, 7],
    17: [4, 5, 6, 7],
  },
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
      { id: 60, chance: 50, conditionValues: [], minLevel: 10, maxLevel: 10 },
      { id: 118, chance: 50, conditionValues: [], minLevel: 10, maxLevel: 10 }
    ],
  },
  superRod: {
    rate: 10,
    pokemon: [
      { id: 60, chance: 17, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 60, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 61, chance: 25, conditionValues: [], minLevel: 18, maxLevel: 18 },
      { id: 72, chance: 25, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 72, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 73, chance: 17, conditionValues: [], minLevel: 21, maxLevel: 21 },
      { id: 131, chance: 19, conditionValues: [], minLevel: 20, maxLevel: 20 }
    ],
  },
  rockSmash: { rate: 0, pokemon: [] }, headbutt: { rate: 0, pokemon: [] }, darkGrass: { rate: 0, pokemon: [] },
  grassSpots: { rate: 0, pokemon: [] }, caveSpots: { rate: 0, pokemon: [] }, bridgeSpots: { rate: 0, pokemon: [] },
  superRodSpots: { rate: 0, pokemon: [] }, surfSpots: {
    rate: 100,
    pokemon: [
      { id: 134, chance: 5, conditionValues: [], minLevel: 25, maxLevel: 29 },
      { id: 121, chance: 9, conditionValues: [], minLevel: 25, maxLevel: 29 },
      { id: 120, chance: 12, conditionValues: [], minLevel: 20, maxLevel: 23 },
      { id: 119, chance: 12, conditionValues: [], minLevel: 20, maxLevel: 28 },
      { id: 118, chance: 10, conditionValues: [], minLevel: 15, maxLevel: 26 },
      { id: 116, chance: 10, conditionValues: [], minLevel: 15, maxLevel: 21 },
      { id: 80, chance: 10, conditionValues: [], minLevel: 24, maxLevel: 30 },
      { id: 73, chance: 10, conditionValues: [], minLevel: 24, maxLevel: 30 }
    ],
  },
  yellowFlowers: { rate: 0, pokemon: [] }, purpleFlowers: { rate: 0, pokemon: [] }, redFlowers: { rate: 0, pokemon: [] },
  roughTerrain: { rate: 0, pokemon: [] }, gift: { rate: 0, pokemon: [] }, giftEgg: { rate: 0, pokemon: [] }, onlyOne: { rate: 0, pokemon: [] },
},
};

export default palletTown;
