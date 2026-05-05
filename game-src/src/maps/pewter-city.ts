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
    1: [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
      24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34,
    ],
    2: [3, 10, 17, 23, 35],
    3: [3, 10, 17, 23, 24, 25, 26, 27, 35],
    4: [3, 10, 16, 17, 19, 23, 26, 35],
    5: [3, 10, 17, 18, 20, 21, 22, 23, 26, 27, 35],
    6: [3, 10, 14, 17, 27, 35],
    7: [3, 10, 11, 12, 13, 15, 16, 17, 27, 35],
    8: [3, 35],
    9: [3, 15, 35],
    10: [3, 34],
    11: [3, 34],
    12: [3, 28, 29, 30, 31, 34],
    13: [3, 28, 30, 31, 34],
    14: [3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 34],
    15: [3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 34, 35, 36, 37, 38, 39],
    16: [3, 12, 13, 14, 15, 16, 17, 22, 23, 24, 25, 35],
    17: [3, 11, 12, 13, 14, 15, 17, 22, 24, 25],
    18: [3, 18],
    19: [3, 18, 33],
    20: [3, 18, 34, 35, 36, 37, 38, 39],
    21: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 34],
    22: [3, 12, 13, 14, 15, 34],
    23: [3, 12, 13, 14, 15, 22, 23, 24, 25, 26, 27, 28, 29, 34],
    24: [3, 12, 13, 14, 15, 21, 30, 34],
    25: [3, 12, 14, 15, 21, 30, 34, 35],
    26: [3, 21, 30, 35],
    27: [3, 21, 30, 35],
    28: [3, 6, 7, 8, 9, 21, 30, 35],
    29: [3, 6, 8, 9, 19, 21, 30, 35],
    30: [3, 35],
    31: [3, 35],
    32: [
      4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25,
      26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ],
    33: [17, 20],
    34: [17, 20],
    35: [17, 20],
  },
  fences: {
    7: [
      4, 5, 6, 8, 9, 18, 19, 20, 21, 22, 23, 24, 25, 26, 28, 29, 30, 32, 33, 34,
    ],
    29: [22, 23, 24, 26, 27, 28, 29],
  },
  grass: {},
  text: {
    9: {
      15: ["BODEGA CASTILLO DE MONJARDÍN", "Tipo VINO · ¡Ven a brindar!"],
    },
    17: {
      11: [
        "SERGIO Y MARTA, guardianes de la BODEGA.",
        "¡Solo los que merezcan brindar podrán pasar!",
      ],
    },
    19: {
      33: [
        "¡AVISO!",
        "El Team Rocket intenta robar la reserva especial.",
        "¡Repórtalo al organizador de la boda!",
      ],
    },
    23: {
      25: ["VILLAMAYOR DE MONJARDÍN", "Tierra del mejor vino de la comarca."],
    },
    29: {
      19: [
        "CONSEJO DE BODA",
        "El que llega tarde a la preboda,",
        "¡pierde turno en la barra libre!",
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
  recoverLocation: { x: 13, y: 26 },
  exits: {
    35: [18, 19],
  },
  exitReturnPos: {
    x: 5,
    y: 1,
  },
  exitReturnMap: MapId.Route2GateNorth,
  trainers: [
    // Catador local — decorativo, vigila la entrada a la Bodega
    {
      npc: hiker,
      pokemon: [{ id: 56, level: 10 }],
      facing: Direction.Down,
      pos: { x: 15, y: 10 },
      persistent: true,
      intro: [],
      outtro: [
        "La BODEGA CASTILLO DE MONJARDÍN está ahí dentro.",
        "Sergio y Marta no dejan pasar a cualquiera.",
        "¡Demuestra lo que vales!",
      ],
      money: 0,
    },
    // Rival de la boda — invitado del novio, combatible
    {
      npc: jrTrainerMale,
      pokemon: [{ id: 23, level: 12 }, { id: 27, level: 11 }],
      facing: Direction.Left,
      pos: { x: 25, y: 10 },
      intro: [
        "¡Yo también quiero la Insignia del Vino!",
        "¡Pero como llegues tú antes, se acaba el cupo!",
        "¡Así que no te dejo pasar!",
      ],
      outtro: ["Está bien... supongo que te la has ganado."],
      money: 250,
    },
    // Enóloga del pueblo — decorativa, da consejo antes del combate final
    {
      npc: beauty,
      pokemon: [{ id: 35, level: 1 }],
      facing: Direction.Right,
      pos: { x: 8, y: 22 },
      persistent: true,
      intro: [],
      outtro: [
        "Si quieres ganar a Sergio y Marta,",
        "necesitas POKÉMON fuertes y buen vino.",
        "Lo del vino ya lo tienes... ¿y lo otro?",
      ],
      money: 0,
    },
    // Investigador de la bodega — combatible, lleva muestras de terroir
    {
      npc: scientist,
      pokemon: [{ id: 100, level: 13 }, { id: 101, level: 12 }],
      facing: Direction.Down,
      pos: { x: 18, y: 22 },
      intro: [
        "¡Estoy analizando el terroir de MONJARDÍN!",
        "¡No me molestes... a menos que puedas con mis POKÉMON!",
      ],
      outtro: [
        "Sorprendente. El terroir de tu equipo también es excelente.",
      ],
      money: 300,
    },
    // Joven que ya venció la Bodega — decorativo, alaba a los líderes
    {
      npc: aceTrainerMale,
      pokemon: [{ id: 58, level: 15 }],
      facing: Direction.Left,
      pos: { x: 28, y: 30 },
      persistent: true,
      intro: [],
      outtro: [
        "Sergio y Marta me dieron la Insignia del Vino el año pasado.",
        "Fue lo más difícil y lo más memorable de mi vida.",
        "¡Tú también puedes lograrlo!",
      ],
      money: 0,
    },
  ],
};

export default pewterCity;
