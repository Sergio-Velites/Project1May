import image from "../assets/map/pewter-city.png";
import { MapId, MapType } from "./map-types";
import { aceTrainerMale, beauty, hiker, jrTrainerMale, scientist } from "../app/npcs";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/pewter-city.mp3";

const pewterCity: MapType = {
  name: "VILLAMAYOR DE MONJARDÍN",
  music,
  image,
  height: 36,
  width: 40,
  start: {
    x: 19,
    y: 34,
  },
walls: {
    4: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
    5: [2, 9, 16, 22, 34],
    6: [2, 9, 16, 22, 23, 24, 25, 26, 34],
    7: [2, 9, 16, 22, 25, 26, 34],
    8: [2, 9, 16, 17, 19, 20, 21, 22, 25, 26, 34],
    9: [2, 9, 16, 26, 34],
    10: [2, 9, 10, 11, 12, 14, 15, 16, 26, 34],
    11: [2, 34],
    12: [2, 33, 34],
    13: [2, 33],
    14: [2, 27, 28, 29, 30, 33],
    15: [2, 27, 28, 29, 30, 33],
    16: [2, 11, 12, 13, 14, 15, 16, 21, 22, 23, 24, 27, 29, 30, 33],
    17: [2, 11, 16, 21, 24, 33, 34],
    18: [2, 11, 16, 21, 24, 33, 34, 35, 36, 37, 38],
    19: [2, 11, 16, 21, 22, 23, 24],
    20: [2, 10, 11, 12, 13, 14, 16, 17, 21, 23, 24],
    21: [2, 17],
    22: [2, 11, 12, 13, 14, 15, 16, 17, 32, 33, 34, 35, 36, 37, 38],
    23: [2, 11, 12, 13, 14, 15, 16, 17, 33, 34, 35, 36, 37, 38],
    24: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 33],
    25: [2, 11, 12, 13, 14, 33],
    26: [2, 11, 12, 13, 14, 21, 22, 23, 24, 25, 26, 27, 28, 33],
    27: [2, 11, 12, 13, 14, 20, 29, 33],
    28: [2, 11, 13, 14, 20, 29, 33, 34],
    29: [2, 20, 29, 34],
    30: [2, 5, 6, 7, 8, 20, 29, 34],
    31: [2, 5, 6, 7, 8, 20, 29, 34],
    32: [2, 5, 7, 8, 18, 20, 29, 34],
    33: [1, 2, 34],
    34: [1, 2, 34],
    35: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34],
  },
fences: {
    10: [3, 4, 5, 7, 8, 17, 18, 19, 20, 21, 22, 23, 24, 25, 27, 28, 29, 31, 32, 33],
    32: [21, 22, 23, 25, 26, 27, 28],
  },
  grass: {},
text: {
    12: {
      14: [
        "BODEGA CASTILLO DE MONJARDÍN",
        "Tipo VINO · ¡Ven a brindar!"
      ],
    },
    20: {
      10: [
        "SERGIO Y MARTA, guardianes de la BODEGA.",
        "¡Solo los que merezcan brindar podrán pasar!"
      ],
      23: [
        "Suministros Monjardín S.L."
      ],
    },
    21: {
      32: [
        "¡AVISO!",
        "El Team Rocket intenta robar la reserva especial.",
        "¡Repórtalo al organizador de la boda!"
      ],
    },
    26: {
      24: [
        "VILLAMAYOR DE MONJARDÍN",
        "Tierra del mejor vino de la comarca."
      ],
    },
    28: {
      13: [
        "Hotel Mirador de Deyo"
      ],
    },
    32: {
      18: [
        "CONSEJO DE BODA",
        "El que llega tarde a la preboda,",
        "¡pierde turno en la barra libre!"
      ],
    },
  },
  maps: {
    7: {
      14: MapId.PewterCityMuseum1f,
    },
    13: {
      29: MapId.PewterCityNpcB,
    },
    16: {
      39: MapId.Route3,
    },
    17: {
      16: MapId.PewterCityGym,
      23: MapId.PewterCityPokeMart,
      39: MapId.Route3,
    },
    18: {
      39: MapId.Route3,
    },
    19: {
      39: MapId.Route3,
    },
    25: {
      13: MapId.PewterCityPokemonCenter,
    },
    29: {
      7: MapId.PewterCityNpcA,
    },
  },

recoverLocation: { x: 12, y: 29 },
  exits: {
    35: [18, 19],
  },
  exitReturnPos: {
    x: 5,
    y: 1,
  },
  exitReturnMap: MapId.Route2GateNorth,
// Trainers para "pewter-city"
trainers: [
  {
  npc: hiker,
  pokemon: [{ id: 56, level: 10 }],
  facing: Direction.Down,
  pos: { x: 15, y: 10 },
  intro: [

  ],
  outtro: [
    "La BODEGA CASTILLO DE MONJARDÍN está ahí dentro.",
    "Sergio y Marta no dejan pasar a cualquiera.",
    "¡Demuestra lo que vales!"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: jrTrainerMale,
  pokemon: [{ id: 23, level: 12 }, { id: 27, level: 11 }],
  facing: Direction.Left,
  pos: { x: 25, y: 11 },
  intro: [
    "¡Yo también quiero la Insignia del Vino!",
    "¡Pero como llegues tú antes, se acaba el cupo!",
    "¡Así que no te dejo pasar!"
  ],
  outtro: [
    "Está bien... supongo que te la has ganado."
  ],
  money: 250,
  persistent: true,
},
  {
  npc: beauty,
  pokemon: [{ id: 35, level: 1 }],
  facing: Direction.Right,
  pos: { x: 8, y: 22 },
  intro: [

  ],
  outtro: [
    "Si quieres ganar a Sergio y Marta,",
    "necesitas POKÉMON fuertes y buen vino.",
    "Lo del vino ya lo tienes... ¿y lo otro?"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: scientist,
  pokemon: [{ id: 100, level: 13 }, { id: 101, level: 12 }],
  facing: Direction.Down,
  pos: { x: 18, y: 22 },
  intro: [
    "¡Estoy analizando el terroir de MONJARDÍN!",
    "¡No me molestes... a menos que puedas con mis POKÉMON!"
  ],
  outtro: [
    "Sorprendente. El terroir de tu equipo también es excelente."
  ],
  money: 300,
  persistent: true,
},
  {
  npc: aceTrainerMale,
  pokemon: [{ id: 58, level: 15 }],
  facing: Direction.Left,
  pos: { x: 28, y: 30 },
  intro: [

  ],
  outtro: [
    "Sergio y Marta me dieron la Insignia del Vino el año pasado.",
    "Fue lo más difícil y lo más memorable de mi vida.",
    "¡Tú también puedes lograrlo!"
  ],
  money: 0,
  persistent: true,
}
],
  gifts: [
    {
      pokemonId: 131,
      level: 15,
      pos: { x: 28, y: 27 },
      questId: "pewter-city-gift-28-27",
    },
  ],
};

export default pewterCity;
