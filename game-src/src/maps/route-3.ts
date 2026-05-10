import { bugCatcher, lass, youngster } from "../app/npcs";
import image from "../assets/map/route-3.png";
import music from "../assets/music/maps/route-3.mp3";
import { Direction } from "../state/state-types";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

const route3: MapType = {
  name: "Ruta 3",
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
      67: ["MONTE LUNA", "Entrada al túnel"],
    },

    27: {
      59: ["RUTA 3", "MONTE LUNA → próxima parada"],
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
// Trainers para "route-3"
trainers: [
  {
  npc: lass,
  pokemon: [],
  facing: Direction.Left,
  pos: { x: 22, y: 27 },
  intro: [
    "¿Me has mirado, verdad?"
  ],
  outtro: [
    "¡Deja de mirarme si no quieres pelea!"
  ],
  money: 135,

},
  {
  npc: bugCatcher,
  pokemon: [],
  facing: Direction.Right,
  pos: { x: 24, y: 27 },
  intro: [
    "¡Ey! ¡Te vi en el BOSQUE AÑIL!"
  ],
  outtro: [
    "Hay otros tipos de PKMN",
    "además de los del bosque!"
  ],
  money: 100,

},
  {
  npc: youngster,
  pokemon: [],
  facing: Direction.Down,
  pos: { x: 21, y: 22 },
  intro: [
    "¡Hola! ¡Me gustan los pantalones cortos! ¡Son cómodos y fáciles de llevar!"
  ],
  outtro: [
    "¿Guardas PKMN en el PC?",
    "¡Cada caja tiene capacidad para 20 PKMN!"
  ],
  money: 165,

},
  {
  npc: bugCatcher,
  pokemon: [],
  facing: Direction.Down,
  pos: { x: 15, y: 22 },
  intro: [
    "¿Eres entrenador? ¡A pelear!"
  ],
  outtro: [
    "Si una CAJA del PC se llena,",
    "¡cambia a otra CAJA!"
  ],
  money: 90,

},
  {
  npc: youngster,
  pokemon: [],
  facing: Direction.Left,
  pos: { x: 27, y: 23 },
  intro: [
    "¡Ey! ¡Tú no llevas pantalones cortos!"
  ],
  outtro: [
    "¡Yo siempre llevo pantalones cortos, hasta en invierno!"
  ],
  money: 210,

},
  {
  npc: lass,
  pokemon: [],
  facing: Direction.Left,
  pos: { x: 14, y: 26 },
  intro: [
    "Esa mirada que me has echado...",
    "¡me resulta muy intrigante!"
  ],
  outtro: [
    "¡Evita peleas sin que te vean!"
  ],
  money: 150,

},
  {
  npc: bugCatcher,
  pokemon: [],
  facing: Direction.Right,
  pos: { x: 10, y: 24 },
  intro: [
    "¡Ven a pelear contra mi nuevo PKMN!"
  ],
  outtro: [
    "¡Los PKMN entrenados son más fuertes que los salvajes!"
  ],
  money: 110,

},
  {
  npc: lass,
  pokemon: [],
  facing: Direction.Up,
  pos: { x: 18, y: 24 },
  intro: [
    "¡Uy! ¿Me has tocado?"
  ],
  outtro: [
    "La RUTA 4 está al pie del MONTE LUNA."
  ],
  money: 210,

}
],
};

export default route3;
