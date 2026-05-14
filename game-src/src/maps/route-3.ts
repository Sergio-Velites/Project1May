import { bugCatcher, lass, youngster } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/route-3.png";
import music from "../assets/music/maps/route-3.mp3";
import { Direction } from "../state/state-types";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

const route3: MapType = {
  name: "Ruta 3 · Camino de la Resaca",
  allowBicycle: true,
  image,
  music,
  height: 36,
  width: 73,
  start: {
    x: 1,
    y: 27,
  },
  walls: {
    3: [53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66],
    4: [53, 60, 61, 63, 66, 68],
    5: [53, 60, 62, 63, 66, 67, 69, 70],
    6: [53, 70],
    7: [53, 67, 70],
    8: [53, 70],
    9: [53, 70],
    10: [53, 70],
    11: [53, 70],
    12: [53, 70],
    13: [53, 70],
    14: [53, 54, 55, 70],
    15: [55, 70],
    16: [55, 64, 65, 66, 67, 68, 69, 70],
    17: [55, 64],
    18: [55, 56, 64],
    19: [55, 56, 64],
    20: [55, 64],
    21: [
      9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
      28, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
      50, 55, 64,
    ],
    22: [9, 28, 33, 55, 50, 60, 61, 62, 63, 64],
    23: [9, 28, 33, 55, 50, 60],
    24: [9, 17, 23, 28, 33, 38, 39, 40, 41, 42, 43, 55, 50, 60],
    25: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 17, 23, 28, 29, 30, 31, 32, 33, 38, 43, 50,
      55, 60, 61, 62, 63, 64, 65, 66,
    ],
    26: [4, 17, 23, 43, 38, 50, 55, 66],
    27: [17, 23, 43, 38, 50, 51, 52, 53, 54, 55, 58, 59, 66],
    28: [9, 17, 23, 43, 38, 66],
    29: [4, 9, 23, 43, 38, 66],
    30: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 23, 43, 38, 66],
    31: [9, 23, 43, 38, 66],
    32: [
      9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
      28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45,
      46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
      64, 65, 66,
    ],
  },
  fences: {
    7: [54, 55, 56, 57],
    9: [64, 65, 66, 67, 68, 69],
    11: [54, 55, 56, 57, 58, 59, 60, 61],
    13: [64, 65, 66, 67, 68, 69],
    15: [56, 57, 58, 59],
    17: [62, 63],
    25: [
      10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 34, 35,
      36, 44, 45, 46, 47, 48, 56, 57, 58,
    ],
    29: [10, 11, 12, 13, 14, 16, 18, 19, 20, 21, 22],
  },
  grass: {
    26: [60, 61, 62, 63, 64, 65],
    27: [60, 61, 62, 63, 64, 65],
    28: [
      58, 59, 60, 61, 62, 63, 64, 65, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
      34, 35, 36, 37,
    ],
    29: [
      58, 59, 60, 61, 62, 63, 64, 65, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
      34, 35, 36, 37,
    ],
    30: [
      58, 59, 60, 61, 62, 63, 64, 65, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
      34, 35, 36, 37,
    ],
    31: [
      58, 59, 60, 61, 62, 63, 64, 65, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33,
      34, 35, 36, 37,
    ],
  },
  text: {
    7: {
      67: ["MONTE LUNA DE MIEL", "¿Quién vuelve a casa así?"],
    },

    27: {
      59: [
        "RUTA 3 · CAMINO DE LA RESACA",
        "Hacia el MONTE LUNA DE MIEL.",
        "Cuidado con los chupasangres,",
        "que ayer ya nos chuparon",
        "hasta la última copa.",
      ],
    },
  },
  maps: {
    5: {
      61: MapId.Route3PokemonCenter,
      68: MapId.MtMoon1f,
    },
  },
  exits: {
    26: [0],
    27: [0],
    28: [0],
    29: [0],
  },
  exitReturnPos: {
    x: 38,
    y: 17,
  },
  encounters: getEncounterData("kanto-route-3-area"),
  exitReturnMap: MapId.PewterCity,
  items: [
    {
      item: ItemType.MasterBall,
      pos: { x: 63, y: 18 },
    },
  ],
// Trainers para "route-3"
trainers: [
  {
  npc: lass,
  pokemon: [{ id: 16, level: 13 }, { id: 19, level: 13 }],
  facing: Direction.Left,
  pos: { x: 22, y: 27 },
  intro: [
    "Eh… ¿tú también vienes de la boda?",
    "¡Pues a celebrar otra vez!"
  ],
  outtro: [
    "¡Marta y Sergio están ya",
    "haciendo las MALETAS para JAPÓN!"
  ],
  money: 135,

},
  {
  npc: bugCatcher,
  pokemon: [{ id: 10, level: 14 }, { id: 13, level: 14 }],
  facing: Direction.Right,
  pos: { x: 24, y: 27 },
  intro: [
    "¿No te vi anoche bailando",
    "sobre una mesa en el SOTO?"
  ],
  outtro: [
    "Yo todavía llevo confeti",
    "en sitios donde no debería haber confeti."
  ],
  money: 100,

},
  {
  npc: youngster,
  pokemon: [{ id: 19, level: 13 }, { id: 19, level: 13 }, { id: 19, level: 13 }],
  facing: Direction.Down,
  pos: { x: 21, y: 22 },
  intro: [
    "¡Hola! ¡Me gustan los pantalones cortos!",
    "¡Aunque hoy llevo el esmoquin aún puesto!"
  ],
  outtro: [
    "En la PC tengo guardado",
    "todo lo que vomité ayer… metafóricamente."
  ],
  money: 165,

},
  {
  npc: bugCatcher,
  pokemon: [{ id: 10, level: 14 }, { id: 11, level: 14 }],
  facing: Direction.Down,
  pos: { x: 15, y: 22 },
  intro: [
    "¿Entrenador o invitado de boda?",
    "¡Da igual! ¡Pelea para despejarte!"
  ],
  outtro: [
    "Esta resaca es PEOR",
    "que un MEWTWO a nivel 70."
  ],
  money: 90,

},
  {
  npc: youngster,
  pokemon: [{ id: 21, level: 15 }, { id: 19, level: 15 }],
  facing: Direction.Left,
  pos: { x: 27, y: 23 },
  intro: [
    "¡Ey! ¡Tú no llevas la pajarita torcida!",
    "¿Es que no fuiste al banquete?"
  ],
  outtro: [
    "¡Yo siempre llevo pantalones cortos!",
    "¡Hasta debajo del esmoquin!"
  ],
  money: 210,

},
  {
  npc: lass,
  pokemon: [{ id: 39, level: 14 }, { id: 16, level: 14 }],
  facing: Direction.Left,
  pos: { x: 14, y: 26 },
  intro: [
    "Esa cara de resaca…",
    "¡también estuviste en VILLAMAYOR!"
  ],
  outtro: [
    "Dicen que MARTA y SERGIO",
    "vuelan a JAPÓN esta semana.",
    "¡Qué envidia me dan!"
  ],
  money: 150,

},
  {
  npc: bugCatcher,
  pokemon: [{ id: 13, level: 14 }, { id: 14, level: 14 }],
  facing: Direction.Right,
  pos: { x: 10, y: 24 },
  intro: [
    "¡Ven a pelear!",
    "¡Necesito sudar el ANTÍS de anoche!"
  ],
  outtro: [
    "Mis PKMN también están con resaca.",
    "¡A todos nos sentó fatal el brindis!"
  ],
  money: 110,

},
  {
  npc: lass,
  pokemon: [{ id: 19, level: 14 }, { id: 29, level: 14 }],
  facing: Direction.Up,
  pos: { x: 18, y: 24 },
  intro: [
    "¡Ay! ¡No me toques la cabeza!",
    "¡Me retumba como un GONG!"
  ],
  outtro: [
    "El MONTE LUNA DE MIEL",
    "queda al fondo de la ruta.",
    "¡Igual que la suite de los novios!"
  ],
  money: 210,

}
],
};

export default route3;
