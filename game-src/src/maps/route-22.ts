import image from "../assets/map/route-22.png";
import { MapId, MapType } from "./map-types";

import getEncounterData from "./get-location-data";
import { lass, rival, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";

const route22: MapType = {
  name: "Ruta 22",
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
    6: [1, 14, 15, 22, 23, 24, 25, 26, 27, 28, 29, 34, 35],
    7: [1, 14, 15, 22, 29, 34],
    8: [1, 14, 15, 22, 29, 34],
    9: [1, 14, 15, 22, 23, 24, 25, 29, 34],
    10: [1, 14, 15, 26, 29, 34, 38, 39],
    11: [1, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 26, 29, 34, 38],
    12: [1, 26, 29, 38],
    13: [1, 26, 27, 28, 29, 38],
    14: [1, 38],
    15: [1, 38],
    16: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
    ],
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
  encounters: getEncounterData("kanto-route-22-area"),
  exitReturnMap: MapId.ViridianCity,
  exitReturnPos: {
    x: 1,
    y: 16,
  },
// Trainers para "route-22"
trainers: [
  {
  npc: rival,
  pokemon: [],
  facing: Direction.Right,
  pos: { x: 26, y: 5 },
  intro: [],
  outtro: [
    "¡Ey!",
    "¿Vas a la LIGA PKMN?",
    "¡Ni lo sueñes!",
    "El guardia no te dejará pasar sin medallas.",
    "¡Con lo tajao que parece que vas!"
  ],
  money: 0,
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
}
],
};

export default route22;
