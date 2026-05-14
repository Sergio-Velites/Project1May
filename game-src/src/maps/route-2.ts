import image from "../assets/map/route-2.png";
import music from "../assets/music/maps/route-1.mp3";
import getEncounterData from "./get-location-data";
import { bugCatcher, jrTrainerMale, lass, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const route2: MapType = {
  name: "Ruta 2",
  allowBicycle: true,
  image,
  music,
  height: 72,
  width: 20,
  start: {
    x: 8,
    y: 70,
  },
  walls: {
    0: [7, 10],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 10, 11, 15, 16, 17, 18, 19],
    2: [10],
    3: [10],
    4: [10],
    5: [10],
    6: [10, 11, 12, 13, 14, 15, 16, 17],
    7: [10, 17],
    8: [10, 17],
    9: [10, 11, 12, 13, 14, 15, 16, 17],
    10: [0, 1, 2, 4, 5, 6, 7, 8, 9],
    11: [2, 4, 11],
    12: [2, 3, 4, 5],
    13: [2, 3, 4, 5],
    14: [2, 3, 4, 5],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    16: [8, 13],
    17: [8, 13],
    18: [8, 13, 14, 15, 16, 17],
    19: [8, 13, 14, 15, 16, 17],
    20: [8, 13],
    21: [8, 13],
    22: [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 16, 17, 18, 19],
    23: [14],
    24: [13],
    25: [13],
    26: [13],
    27: [13],
    28: [13],
    29: [13],
    30: [13],
    31: [13],
    32: [13],
    33: [13],
    34: [13],
    35: [13, 14, 15, 18, 19],
    36: [13, 16, 17],
    37: [3, 13],
    38: [0, 1, 2, 4, 5, 6, 7, 8, 9, 13],
    39: [2, 4, 10, 13, 14, 15, 16, 17, 18, 19],
    40: [2, 3, 4, 5, 10, 13],
    41: [2, 3, 4, 5, 10, 13],
    42: [2, 3, 4, 5, 10, 13],
    43: [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 13],
    44: [11],
    45: [11],
    46: [11],
    47: [11],
    48: [11],
    49: [11],
    50: [11],
    51: [11],
    52: [12],
    53: [6, 7, 8, 9, 10, 11, 12, 13],
    54: [5, 6, 7, 8, 9, 10, 11, 12],
    55: [5, 6, 7, 8, 9, 10, 11, 12],
    56: [6, 7, 8, 9, 10, 11, 12],
    57: [12],
    58: [12],
    59: [12],
    60: [0, 1, 12],
    61: [1, 12],
    62: [1, 12],
    63: [1, 12],
    64: [1, 12],
    65: [1, 5, 12],
    66: [1, 12],
    67: [1, 12],
    68: [1, 12],
    69: [1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    70: [2, 3, 4, 5, 6, 10],
    71: [6, 10],
  },
  fences: {
    19: [0, 1, 2, 3, 4, 5, 6, 7],
    27: [14, 15, 16, 18, 19],
    31: [14, 15, 16, 18, 19],
    43: [14, 16, 17, 18, 19],
    47: [0, 1, 2, 3, 4, 5, 6, 7],
    49: [12, 13, 14, 16, 17, 18, 19],
    61: [2, 3, 4, 5, 6, 8, 9, 10, 11],
  },
  grass: {
    2: [0, 1, 2, 3, 4, 5, 6, 7],
    3: [0, 1, 2, 3, 4, 5, 6, 7],
    4: [0, 1, 2, 3, 4, 5, 6, 7],
    5: [0, 1, 2, 3, 4, 5, 6, 7],
    6: [0, 1, 2, 3, 4, 5, 6, 7],
    7: [0, 1, 2, 3, 4, 5, 6, 7],
    20: [0, 1, 4, 5, 6, 7],
    21: [0, 1, 4, 5, 6, 7],
    48: [4, 5, 6, 7, 8, 9],
    49: [4, 5, 6, 7, 8, 9],
    50: [4, 5, 6, 7, 8, 9],
    51: [4, 5, 6, 7, 8, 9],
  },
  text: {
    11: {
      11: [
        "RUTA 2: El sendero de los valientes.",
        "¡La boda espera al final del camino!",
      ],
    },
    65: {
      5: ["RUTA 2: Ciudad Añil - Ciudad Plateada"],
    },
  },

  encounters: getEncounterData("kanto-route-2-south-towards-viridian-city"),
 
// Trainers para "route-2"
// Trainers para "route-2"
trainers: [
  {
  npc: lass,
  pokemon: [{ id: 16, level: 7 }, { id: 19, level: 7 }],
  facing: Direction.Right,
  pos: { x: 6, y: 2 },
  intro: [
    "¡Salí a pasear y me perdí!",
    "¡Pero mientras espero, voy a entrenar!"
  ],
  outtro: [
    "La BODEGA CASTILLO DE MONJARDÍN está al norte. ¡No te pierdas tú también!"
  ],
  money: 105,

},
  {
  npc: youngster,
  pokemon: [{ id: 19, level: 8 }, { id: 21, level: 8 }],
  facing: Direction.Down,
  pos: { x: 5, y: 48 },
  intro: [
    "¡Ey! ¡Un entrenador en la ruta!",
    "¡Me aburro mucho caminando solo!",
    "¡Vamos a combatir!"
  ],
  outtro: [
    "¡Buen combate! Ahora el camino se me hace más corto."
  ],
  money: 140,

},
  {
  npc: bugCatcher,
  pokemon: [{ id: 13, level: 9 }, { id: 14, level: 9 }],
  facing: Direction.Left,
  pos: { x: 9, y: 62 },
  intro: [
    "¡Cuidado con pisar los bichos!",
    "¡Son mis guerreros de la boda!",
    "¡A ver si puedes con ellos!"
  ],
  outtro: [
    "¡Sorprendente! Sigue al norte, el bosque te espera."
  ],
  money: 110,

},
  {
  npc: jrTrainerMale,
  pokemon: [{ id: 32, level: 10 }, { id: 23, level: 10 }],
  facing: Direction.Down,
  pos: { x: 7, y: 44 },
  intro: [
    "¡Alto! Este camino lleva al BOSQUECILLO.",
    "¡Solo los entrenadores preparados siguen adelante!",
    "¡Demuéstrame que estás listo!"
  ],
  outtro: [
    "¡Impresionante! El BOSQUECILLO te espera. Ten cuidado con los ZUBAT."
  ],
  money: 200,

}
],
maps: {
    0: {
      8: MapId.PewterCity,
      9: MapId.PewterCity,
    },
    43: {
      3: MapId.Route2Gate,
    },
  },
teleports: {
    11: {
      3: { map: MapId.Route2GateNorth, pos: { x: 5, y: 1 } },
    },
  },
exits: {
    71: [7, 8, 9],
  },
  staticPokemon: [
    {
      pokemonId: 113,
      level: 20,
      sprite: "cute-a",
      pos: { x: 0, y: 2 },
      questId: "route-2-static-0-2",
      intro: ["A lo mejor me viene bien una enferemera",
        " para la postboda!"],
    },
  ],
exitReturnMap: MapId.ViridianCity,
exitReturnPos: { x: 18, y: 1 },
};

export default route2;
