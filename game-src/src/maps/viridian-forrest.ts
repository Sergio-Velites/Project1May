import { bugCatcher, beauty, hiker, lass, pokeManiac, teamRocketGrunt } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/viridian-forrest.png";
import { Direction } from "../state/state-types";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

const viridianForrest: MapType = {
  name: "EL BOSQUECILLO",
  allowBicycle: true,
  image,
  height: 48,
  width: 34,
  start: {
    x: 16,
    y: 46,
  },
  walls: {
    0: [
      0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
      22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
    ],
    1: [0, 2, 3, 4, 5, 14, 15, 33],
    2: [0, 3, 4, 5, 14, 15, 33],
    3: [0, 3, 4, 5, 14, 15, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 33],
    4: [
      0, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      33,
    ],
    5: [
      0, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      33,
    ],
    6: [
      0, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      33,
    ],
    7: [
      0, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      33,
    ],
    8: [0, 3, 4, 5, 9, 10, 14, 15, 33],
    9: [0, 3, 4, 5, 9, 10, 14, 15, 33],
    10: [0, 3, 4, 5, 9, 10, 14, 15, 19, 20, 21, 22, 23, 24, 27, 28, 29, 33],
    11: [0, 3, 4, 5, 9, 10, 14, 15, 19, 24, 27, 28, 29, 33],
    12: [0, 3, 4, 5, 9, 10, 14, 15, 19, 24, 27, 28, 29, 33],
    13: [0, 3, 4, 5, 9, 10, 14, 15, 19, 24, 27, 28, 29, 33],
    14: [0, 3, 4, 5, 9, 10, 14, 15, 19, 24, 27, 28, 29, 33],
    15: [0, 3, 4, 5, 9, 10, 14, 15, 19, 24, 27, 28, 29, 33],
    16: [0, 3, 4, 5, 9, 10, 19, 24, 27, 28, 29, 33],
    17: [0, 3, 4, 5, 9, 10, 19, 24, 26, 27, 28, 29, 33],
    18: [0, 3, 4, 5, 9, 10, 19, 24, 33],
    19: [0, 3, 4, 5, 9, 10, 19, 24, 33],
    20: [
      0, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 24, 28, 29, 30, 33,
    ],
    21: [0, 3, 4, 5, 9, 10, 24, 28, 29, 30, 33],
    22: [0, 9, 10, 24, 28, 29, 30, 33],
    23: [0, 9, 10, 11, 12, 24, 28, 29, 30, 33],
    24: [0, 4, 13, 24, 28, 29, 30, 33],
    25: [0, 13, 24, 28, 29, 30, 33],
    26: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 24, 28, 29, 30, 33],
    27: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 24, 28, 29, 30, 33],
    28: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 24, 28, 29, 30, 33],
    29: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13, 24, 28, 29, 30, 33],
    30: [0, 9, 11, 12, 24, 28, 29, 30, 33],
    31: [0, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 24, 28, 29, 30, 33],
    32: [0, 1, 2, 3, 4, 5, 16, 19, 24, 33],
    33: [5, 19, 24, 33],
    34: [5, 9, 10, 11, 12, 13, 14, 19, 24, 28, 29, 30, 31, 32, 33],
    35: [5, 9, 10, 11, 12, 13, 14, 19, 24, 28, 29, 30, 31, 32, 33],
    36: [5, 9, 10, 11, 12, 13, 14, 19, 24, 28, 29, 30, 31, 32, 33],
    37: [5, 9, 10, 11, 12, 13, 14, 19, 24, 28, 29, 30, 31, 32, 33],
    38: [5, 9, 10, 11, 12, 13, 14, 19, 24, 28, 29, 30, 31, 32, 33],
    39: [
      0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22, 23, 24, 28, 29,
      30, 31, 32, 33,
    ],
    40: [0, 24, 33],
    41: [0, 16, 17, 33],
    42: [0, 16, 17, 33],
    43: [0, 33],
    44: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20, 21, 22, 23, 24,
      25, 26, 27, 28, 29, 30, 31, 32, 33,
    ],
    45: [14, 18, 19],
    46: [14, 19],
    47: [14, 19],
  },
  fences: {},
  grass: {
    6: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18],
    7: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18],
    8: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23],
    9: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23],
    10: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    11: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    12: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    13: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    14: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    15: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    16: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    17: [1, 2, 6, 7, 8, 11, 12, 13, 16, 17, 18, 30, 31, 32],
    18: [1, 2, 6, 7, 8],
    19: [1, 2, 6, 7, 8],
    20: [1, 2, 6, 7, 8, 25, 26, 27],
    21: [1, 2, 6, 7, 8, 25, 26, 27],
    22: [1, 2, 3, 6, 7, 8, 25, 26, 27],
    23: [1, 2, 3, 6, 7, 8, 25, 26, 27],
    24: [25, 26, 27],
    25: [25, 26, 27],
    26: [25, 26, 27],
    27: [25, 26, 27],
    28: [25, 26, 27],
    29: [25, 26, 27],
    30: [1, 2, 3, 4, 5, 6, 7, 8, 25, 26, 27],
    31: [1, 2, 3, 4, 5, 6, 7, 8, 25, 26, 27],
    32: [8, 9, 10, 11, 12, 13, 14, 15, 18, 25],
    33: [8, 9, 10, 11, 12, 13, 14, 15, 18, 25],
    34: [8, 18, 25],
    35: [8, 18, 25],
    36: [8, 18, 25],
    37: [8, 18, 25],
    38: [8, 18, 25],
    39: [8, 18, 25],
    40: [
      1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 25,
      28, 29, 30, 31, 32,
    ],
    41: [
      1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22, 23, 24,
      25, 28, 29, 30, 31, 32,
    ],
    42: [1, 2, 3, 4, 5, 28, 29, 30, 31, 32],
    43: [1, 2, 3, 4, 5, 28, 29, 30, 31, 32],
  },
text: {
    1: {
      2: [
        "SALIENDO DEL BOSQUECILLO",
        "VILLAMAYOR DE MONJARDÍN ADELANTE"
      ],
    },
    17: {
      26: [
        "CONSEJOS DE ENTRENADOR. Toma más anís"
      ],
    },
    24: {
      4: [
        "En memoria a Juanito. Cisne de la TAKONERA"
      ],
    },
    32: {
      16: [
        "¡Para el VENENO usa Pacharás Basarana! No cura pero tendrás una muerte más dulce"
      ],
    },
    40: {
      24: [
        "CONSEJOS DE ENTRENADOR. Come menos, bebea más"
      ],
    },
    45: {
      18: [
        "CONSEJOS DE ENTRENADOR. Evita los chistes de Fernando"
      ],
    },
    47: {
      5: [
        "CONSEJOS DE ENTRENADOR",
        "¡No robes vino!",
        "¡compártelo!"
      ],
    },
  },
  maps: {
    0: {
      1: MapId.Route2GateNorth,
      2: MapId.Route2GateNorth,
    },
  },
  exits: {
    47: [15, 16, 17, 18],
  },
  encounters: getEncounterData("viridian-forest-area"),
  exitReturnPos: {
    x: 5,
    y: 1,
  },
  exitReturnMap: MapId.Route2Gate,
// Trainers para "viridian-forrest"
// Trainers para "viridian-forrest"
trainers: [
  {
  npc: bugCatcher,
  pokemon: [{ id: 13, level: 5 }, { id: 10, level: 6 }],
  facing: Direction.Left,
  pos: { x: 29, y: 19 },
  intro: [
    "¡Detente, invitado de la boda!",
    "¡Primero debes combatir!"
  ],
  outtro: [
    "¡Qué batalla tan emocionante!",
    "¡Sigue tu camino, valiente!"
  ],
  money: 60,

},
  {
  npc: bugCatcher,
  pokemon: [{ id: 10, level: 6 }, { id: 11, level: 7 }, { id: 13, level: 6 }],
  facing: Direction.Left,
  pos: { x: 28, y: 33 },
  intro: [
    "¡Los insectos son los mejores!",
    "¡Protegen el bosque de la boda!"
  ],
  outtro: [
    "¡Bien luchado!",
    "¡Disfruta la celebración!"
  ],
  money: 70,

},
  {
  npc: bugCatcher,
  pokemon: [{ id: 14, level: 7 }, { id: 11, level: 7 }],
  facing: Direction.Left,
  pos: { x: 2, y: 19 },
  intro: [
    "¡Nadie pasa sin combatir!",
    "¡Así lo dice la ley del bosque!"
  ],
  outtro: [
    "¡Felicidades a los novios!",
    "¡Que sean muy felices!"
  ],
  money: 60,

},
  {
  npc: beauty,
  pokemon: [{ id: 16, level: 4 }],
  facing: Direction.Down,
  pos: { x: 25, y: 8 },
  intro: [

  ],
  outtro: [
    "¡Corre, que la barra libre se acaba!"
  ],
  money: 0,

},
  {
  npc: lass,
  pokemon: [{ id: 35, level: 4 }],
  facing: Direction.Right,
  pos: { x: 17, y: 40 },
  intro: [

  ],
  outtro: [
    "¡El DJ ya está calentando! ¡Mueve las piernas!"
  ],
  money: 0,

},
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 52, level: 10 }, { id: 41, level: 9 }],
  facing: Direction.Down,
  pos: { x: 16, y: 6 },
  intro: [
    "¡Teníamos un plan perfecto!",
    "¡Queríamos los Pokémon de la boda!",
    "...pero nos llevamos este anís de mientras."
  ],
  outtro: [
    "¡Que disfrutes de la preboda, crío!"
  ],
  money: 150,

},
  {
  npc: hiker,
  pokemon: [{ id: 74, level: 7 }],
  facing: Direction.Right,
  pos: { x: 6, y: 3 },
  intro: [

  ],
  outtro: [
    "¡Este bosque lleva directo a VILLAMAYOR!",
    "Sigue hacia el norte y no te metas en la hierba alta.",
    "¡Los bichos aquí pican fuerte!"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: pokeManiac,
  pokemon: [{ id: 46, level: 11 }, { id: 48, level: 10 }],
  facing: Direction.Down,
  pos: { x: 13, y: 11 },
  intro: [
    "¡Llevo tres días leyendo el menú del banquete!",
    "¡Nadie merece ese chuletón más que yo!",
    "¡Demuestra que tú sí lo mereces!"
  ],
  outtro: [
    "Vale, vale... tú te lo ganas más que yo."
  ],
  money: 120,

},
  {
  npc: lass,
  pokemon: [{ id: 10, level: 5 }],
  facing: Direction.Left,
  pos: { x: 5, y: 22 },
  intro: [

  ],
  outtro: [
    "¿Has visto a mis padres?",
    "Se llaman Juan y María...",
    "¡Llevan corbata de lunares los dos!"
  ],
  money: 0,
  persistent: true,
}
],
  items: [
    {
      item: ItemType.PokeBall,
      pos: {
        x: 1,
        y: 31,
      },
    },
    {
      item: ItemType.PpUp, // TODO: Should be Antidote
      pos: {
        x: 25,
        y: 11,
      },
    },
    {
      item: ItemType.Potion,
      pos: {
        x: 12,
        y: 29,
      },
    },
  ],
};

export default viridianForrest;
