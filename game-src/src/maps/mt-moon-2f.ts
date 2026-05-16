import { superNerd, teamRocketGrunt } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/mt-moon-2f.png";
import music from "../assets/music/maps/mt-moon.mp3";
import { Direction } from "../state/state-types";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

const mtMoon2f: MapType = {
  name: "Monte Luna de Miel 2F",
  allowBicycle: true,
  image,
  music,
  cave: true,
  height: 36,
  width: 40,
  start: {
    x: 3,
    y: 6,
  },
  walls: {
    0: [],
    1: [2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 8],
    2: [2, 17, 19],
    3: [2, 17, 19],
    4: [2, 17, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31],
    5: [
      2, 1, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 19, 23, 24, 25, 26, 31, 32,
      33, 34, 35, 36,
    ],
    6: [1, 8, 17, 19, 23, 26, 31, 36],
    7: [1, 8, 17, 19, 23, 26, 27, 30, 31, 36],
    8: [1, 8, 17, 18, 19, 23, 36],
    9: [1, 2, 3, 4, 5, 6, 7, 8, 17, 14, 11, 10, 9, 18, 19, 23, 36, 33],
    10: [17, 14, 7, 18, 19, 23, 36],
    11: [
      17, 14, 15, 16, 7, 18, 19, 39, 23, 36, 37, 38, 24, 25, 26, 27, 28, 29, 30,
      31, 32, 33, 34, 35,
    ],
    12: [7, 39, 30, 29, 18, 19],
    13: [7, 8, 9, 10, 11, 15, 16, 17, 18, 19, 39, 30, 29, 14],
    14: [11, 14, 19, 39, 30, 29],
    15: [
      11, 10, 9, 8, 7, 6, 14, 15, 16, 17, 18, 19, 24, 25, 39, 35, 34, 31, 30,
      29, 28,
    ],
    16: [6, 18, 19, 24, 39, 35],
    17: [6, 18, 19, 24, 39, 35],
    18: [6, 18, 19, 24, 39, 35],
    19: [
      6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
      30, 31, 32, 39, 35,
    ],
    20: [6, 12, 13, 31, 39, 35],
    21: [
      6, 12, 13, 30, 27, 28, 29, 22, 21, 20, 19, 18, 17, 16, 15, 14, 31, 32, 33,
      34, 35, 39,
    ],
    22: [6, 12, 13, 30, 27, 22, 31, 39],
    23: [6, 12, 13, 30, 27, 26, 23, 22, 31, 39],
    24: [6, 12, 13, 30, 31, 39],
    25: [6, 35, 12, 13, 30, 31, 36, 37, 38, 39],
    26: [6, 35, 12, 13, 30, 31],
    27: [6, 35, 12, 13, 30, 31],
    28: [
      6, 35, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
      29, 30, 31,
    ],
    29: [6, 35, 22, 23, 24, 25, 26, 12, 31],
    30: [
      6, 35, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 26, 27, 28, 29, 30, 25,
      24, 23, 31,
    ],
    31: [6, 35],
    32: [6, 35],
    33: [
      6, 7, 8, 10, 13, 16, 18, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
      33, 34, 35, 22, 19, 17, 15, 14, 12, 11, 9,
    ],
    34: [],
    35: [],
  },
  fences: {},
  grass: {},
  text: {},
  maps: {},
  exits: {},
  teleports: {
    7: {
      5: {
        map: MapId.MtMoon3f,
        pos: {
          x: 22,
          y: 2,
        },
      },
    },
    9: {
      25: {
        map: MapId.MtMoon3f,
        pos: {
          x: 18,
          y: 10,
        },
      },
    },
    17: {
      21: {
        map: MapId.MtMoon3f,
        pos: {
          x: 20,
          y: 17,
        },
      },
    },
    27: {
      15: {
        map: MapId.MtMoon3f,
        pos: {
          x: 14,
          y: 26,
        },
      },
    },
  },

  encounters: getEncounterData("mt-moon-b2f"),
  exitReturnPos: {
    x: 1,
    y: 1,
  },
  exitReturnMap: MapId.MtMoon1f,
// Trainers para "mt-moon-2f"
trainers: [
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 24, level: 31 }, { id: 42, level: 32 }],
  facing: Direction.Down,
  pos: { x: 12, y: 2 },
  intro: [
    "¡Robamos el anís del convite!",
    "¡Párate si quieres verlo de nuevo!"
  ],
  outtro: [
    "¡El EQUIPO ROCKET nunca falta",
    "a un saqueo — ni a una boda!",
    "¡Maldición! ¡Mis compis siguen",
    "durmiendo la mona en un rincón!"
  ],
  money: 180,
  persistent: true,
},
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 42, level: 30 }, { id: 110, level: 33 }],
  facing: Direction.Up,
  pos: { x: 3, y: 8 },
  intro: [
    "¡Buscamos los regalos de los novios!",
    "¡Lárgate, crío, antes de que me caliente!"
  ],
  outtro: [
    "¡Estamos buscando los regalos",
    "de los novios! ¡Lárgate, crío!",
    "Si encuentras algún ANTÍS sin abrir,",
    "¡dánoslo y nos largamos!"
  ],
  money: 180,
  persistent: true,
},
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 110, level: 28 }],
  facing: Direction.Left,
  pos: { x: 14, y: 18 },
  intro: [
    "¡Con esta cueva tenemos el escondite perfecto!",
    "¡Nadie nos encontrará... hasta ahora!"
  ],
  outtro: [
    "¡Los críos sin resaca",
    "no entenéis el sufrimiento adulto!",
    "MARTA y SERGIO ya andan haciendo",
    "las maletas para JAPÓN… ¡y nosotros aquí!"
  ],
  money: 180,
  persistent: true,
},
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 24, level: 33 }, { id: 42, level: 31 }],
  facing: Direction.Down,
  pos: { x: 11, y: 16 },
  intro: [
    "¡Lleva tus Pokémon por otro sitio!",
    "¡Este pasillo es nuestro!"
  ],
  outtro: [
    "¡El EQUIPO ROCKET revenderá",
    "todas las botellas vacías del banquete!",
    "¡Me has enfadado!",
    "¡Ya nos vengaremos en TOKIO!"
  ],
  money: 180,
  persistent: true,
},
  {
  npc: superNerd,
  pokemon: [{ id: 101, level: 28 }, { id: 82, level: 29 }],
  facing: Direction.Right,
  pos: { x: 20, y: 14 },
  intro: [
    "Analizo el subsuelo por si el banquete necesita hielo.",
    "¡Pero mi equipo también quiere practicar!"
  ],
  outtro: [
    "¡Eh, para! ¡Estos sushis caíos",
    "de la mesa son míos! ¡Los dos!",
    "¡Vale, uno cada uno!",
    "Que los novios se llevan el resto a JAPÓN."
  ],
  money: 140,
  persistent: true,
}
]
};

export default mtMoon2f;
