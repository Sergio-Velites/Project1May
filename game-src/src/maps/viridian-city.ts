import viridianCityImage from "../assets/map/viridian-city.png";
import { MapId, MapType } from "./map-types";
import { cueBall, fisher, gentleman, jrTrainerFemale, lass, rocker, sailor, teamRocketGrunt } from "../app/npcs";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/pewter-city.mp3";
import getEncounterData from "./get-location-data";

const viridianCity: MapType = {
  name: "SOTO LEZKAIRU",
  image: viridianCityImage,
  height: 36,
  width: 40,
  start: {
    x: 20,
    y: 34,
  },
  walls: {
    0: [16, 20],
    1: [16, 19, 20, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    2: [16, 20, 23, 36],
    3: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 21, 22, 23, 36],
    4: [5, 14, 28, 29, 30, 31, 32, 33, 36],
    5: [5, 8, 9, 10, 11, 12, 13, 14, 15, 28, 29, 30, 31, 32, 33, 36],
    6: [5, 7, 16, 20, 28, 29, 30, 31, 32, 33, 36],
    7: [5, 7, 16, 20, 27, 28, 29, 30, 31, 33, 36],
    8: [5, 7, 16, 20, 21, 22, 23, 36],
    9: [5, 7, 16, 20, 22, 23, 36],
    10: [5, 7, 16, 36],
    11: [5, 7, 16, 36],
    12: [5, 7, 16, 36],
    13: [
      0, 1, 2, 3, 4, 5, 7, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
      32, 33, 34, 35, 36,
    ],
    14: [7, 16, 20, 21, 22, 23, 36],
    15: [7, 16, 20, 22, 23, 36],
    16: [8, 9, 10, 11, 12, 13, 14, 15, 28, 29, 30, 31, 36],
    17: [17, 20, 21, 22, 23, 28, 29, 30, 31, 36],
    18: [0, 1, 2, 3, 28, 29, 30, 31, 36],
    19: [3, 28, 30, 31, 36],
    20: [3, 36],
    21: [3, 4, 5, 6, 7, 36],
    22: [3, 8, 22, 23, 24, 25, 36],
    23: [3, 8, 9, 22, 23, 24, 25, 36],
    24: [3, 8, 9, 10, 11, 12, 13, 22, 23, 24, 25, 36],
    25: [3, 8, 9, 10, 11, 12, 13, 22, 24, 25, 36],
    26: [3, 8, 9, 10, 11, 12, 13, 36],
    27: [3, 8, 9, 10, 11, 12, 13, 36],
    28: [3, 36],
    29: [3, 21, 36],
    30: [3, 36],
    31: [
      3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24,
      25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
    ],
    32: [19, 22],
    33: [19, 22],
    34: [19, 22],
    35: [19, 22],
  },
  fences: {
    9: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    27: [
      4, 5, 6, 7, 14, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
      31, 32, 33, 34, 35,
    ],
  },
  text: {
    29: {
      21: [
        "¡Bienvenido al SOTO LEZKAIRU!",
        "Lugar de preboda y celebración.",
      ],
    },
    25: {
      24: [
        "En el Soto, el vino corre más que el agua.",
      ],
    },
    19: {
      30: [
        "¡Que vivan los novios!",
        "¡Y que el anís no falte!",
      ],
    },
    17: {
      17: [
        "AVISO: Reserva de vino protegida.",
        "Manos fuera, Team Rocket.",
      ],
    },
    7: {
      27: [
        "Bodega CASTILLO DE MONJARDÍN →",
        "¡Demuestra que mereces brindar!",
      ],
    },
    1: {
      19: [
        "RUTA 2 · Hacia VILLAMAYOR →",
      ],
    },
  },
  maps: {
    0: {
      17: MapId.Route2,
      18: MapId.Route2,
      19: MapId.Route2,
    },
    7: {
      32: MapId.ViridianCityGym,
    },
    9: {
      21: MapId.ViridianCityNpcHouse,
    },
    14: {
      0: MapId.Route22,
    },
    15: {
      0: MapId.Route22,
      21: MapId.ViridianCityPokemonAcadamy,
    },
    16: {
      0: MapId.Route22,
    },
    17: {
      0: MapId.Route22,
    },
    19: {
      29: MapId.ViridianCityPokeMart,
    },
    25: {
      23: MapId.ViridianCityPokemonCenter,
    },
  },
  exits: {
    35: [20, 21],
  },
  music,
  grass: {},
  encounters: getEncounterData("viridian-city-area"),
  recoverLocation: { x: 23, y: 26 },
  exitReturnMap: MapId.Route1,
  exitReturnPos: {
    x: 11,
    y: 1,
  },
  trainers: [
    {
      npc: cueBall,
      pokemon: [{ id: 19, level: 4 }],
      facing: Direction.Down,
      pos: { x: 12, y: 20 },
      intro: [
        "¡Hemos montado nuestra propia preboda!",
        "¡Con vino barato y sin protocolo!",
        "¡Demuestra que mereces el bueno!",
      ],
      outtro: ["...igual el vino caro tampoco está tan mal."],
      money: 80,
    },
    {
      npc: jrTrainerFemale,
      pokemon: [{ id: 41, level: 5 }],
      facing: Direction.Left,
      pos: { x: 26, y: 24 },
      intro: [
        "¡Nosotros también queremos brindar!",
        "¡Pero solo si nos ganas!",
      ],
      outtro: ["¡Felicidades! ¡Brindamos juntos el 8 de agosto!"],
      money: 100,
    },
    {
      npc: teamRocketGrunt,
      pokemon: [{ id: 33, level: 5 }, { id: 52, level: 4 }],
      facing: Direction.Down,
      pos: { x: 11, y: 11 },
      intro: [
        "¡Con este vino seremos los reyes de la fiesta!",
        "¡No te metas en nuestros asuntos!",
      ],
      outtro: ["¡Maldición! Nos retiramos... pero volveremos por el anís."],
      money: 200,
    },
    {
      npc: gentleman,
      pokemon: [{ id: 1, level: 1 }],
      facing: Direction.Down,
      pos: { x: 27, y: 22 },
      persistent: true,
      intro: [],
      outtro: [
        "Joven, el vino tinto cura... y anima.",
        "Toma una botella para el camino.",
        "¡Salud!",
      ],
      money: 0,
    },
    // DJ preparando el equipo — decorativo
    {
      npc: rocker,
      pokemon: [{ id: 25, level: 1 }],
      facing: Direction.Right,
      pos: { x: 18, y: 8 },
      persistent: true,
      intro: [],
      outtro: [
        "¡El equipo de sonido ya está enchufado!",
        "¡En cuanto lleguen los novios, esto se lía!",
      ],
      money: 0,
    },
    // Invitada madrugadora — ya está sentada reservando sitio
    {
      npc: lass,
      pokemon: [{ id: 35, level: 3 }],
      facing: Direction.Down,
      pos: { x: 9, y: 4 },
      persistent: true,
      intro: [],
      outtro: [
        "Llegué la primera. Esta silla ya tiene dueña.",
        "¡A ver si venís más tarde!",
      ],
      money: 0,
    },
    // Fotógrafo — moviéndose por el soto buscando el ángulo perfecto
    {
      npc: sailor,
      pokemon: [{ id: 54, level: 5 }],
      facing: Direction.Left,
      pos: { x: 14, y: 20 },
      persistent: true,
      intro: [],
      outtro: [
        "¡Quieto! ¡Esto es para las fotos del álbum!",
        "¡La luz aquí es perfecta!",
      ],
      money: 0,
    },
    // Invitado perdido — combatible
    {
      npc: fisher,
      pokemon: [{ id: 118, level: 5 }, { id: 129, level: 4 }],
      facing: Direction.Down,
      pos: { x: 15, y: 30 },
      intro: [
        "¡No sé dónde es la preboda!",
        "¡Y encima tú te has metido en mi camino!",
      ],
      outtro: ["Gracias... Creo que es por aquí."],
      money: 60,
    },
  ],
};

export default viridianCity;
