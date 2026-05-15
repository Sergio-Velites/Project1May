import viridianCityImage from "../assets/map/viridian-city.png";
import { MapId, MapType } from "./map-types";
import { cueBall, fisher, gentleman, jrTrainerFemale, lass, rocker, sailor, teamRocketGrunt } from "../app/npcs";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/pallet-town.mp3";
import getEncounterData from "./get-location-data";

const viridianCity: MapType = {
  name: "SOTO LEZKAIRU",
  allowBicycle: true,
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
    13: [0, 1, 2, 3, 4, 5, 7, 16, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
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
    24: [3, 22, 23, 24, 25, 36],
    25: [3, 22, 24, 25, 36],
    26: [3, 36],
    27: [3, 36],
    28: [3, 36],
    29: [3, 21, 36],
    30: [3, 36],
    31: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
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
    1: {
      19: [
        "RUTA 2 · Hacia VILLAMAYOR →"
      ],
    },
    7: {
      27: [
        "RINCÓN DE PENSAR. Lugar abandonado. Antiguo emplazamiento para quedada de cuadrillas"
      ],
    },
    17: {
      17: [
        "AVISO: Reserva de vino protegida.",
        "Manos fuera, Team Rocket."
      ],
    },
    19: {
      30: [
        "¡Que vivan los novios!",
        "¡Y que el anís no falte!"
      ],
    },
    25: {
      24: [
        "En el Soto, el vino corre más que el agua."
      ],
    },
    29: {
      21: [
        "¡SOTO LEZKAIRU!",
        "Bienvenido al glamour."
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
      { id: 60, chance: 50, conditionValues: [], minLevel: 10, maxLevel: 11 },
      { id: 118, chance: 50, conditionValues: [], minLevel: 10, maxLevel: 12 },
      { id: 129, chance: 61, conditionValues: [], minLevel: 5, maxLevel: 6 },
      { id: 116, chance: 14, conditionValues: [], minLevel: 8, maxLevel: 9 },
      { id: 120, chance: 35, conditionValues: [], minLevel: 8, maxLevel: 9 },
      { id: 147, chance: 10, conditionValues: [], minLevel: 10, maxLevel: 11 }
    ],
  },
  superRod: {
    rate: 10,
    pokemon: [
      { id: 60, chance: 17, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 60, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 79, chance: 25, conditionValues: [], minLevel: 15, maxLevel: 79 },
      { id: 72, chance: 25, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 72, chance: 8, conditionValues: [], minLevel: 15, maxLevel: 15 },
      { id: 54, chance: 17, conditionValues: [], minLevel: 15, maxLevel: 15 }
    ],
  },
  rockSmash: { rate: 0, pokemon: [] }, headbutt: { rate: 0, pokemon: [] }, darkGrass: { rate: 0, pokemon: [] },
  grassSpots: { rate: 0, pokemon: [] }, caveSpots: { rate: 0, pokemon: [] }, bridgeSpots: { rate: 0, pokemon: [] },
  superRodSpots: { rate: 0, pokemon: [] }, surfSpots: {
    rate: 100,
    pokemon: [
      { id: 54, chance: 10, conditionValues: [], minLevel: 23, maxLevel: 25 },
      { id: 130, chance: 5, conditionValues: [], minLevel: 25, maxLevel: 30 },
      { id: 131, chance: 10, conditionValues: [], minLevel: 26, maxLevel: 100 },
      { id: 138, chance: 10, conditionValues: [], minLevel: 20, maxLevel: 24 },
      { id: 134, chance: 3, conditionValues: [], minLevel: 20, maxLevel: 30 },
      { id: 140, chance: 10, conditionValues: [], minLevel: 20, maxLevel: 24 }
    ],
  },
  yellowFlowers: { rate: 0, pokemon: [] }, purpleFlowers: { rate: 0, pokemon: [] }, redFlowers: { rate: 0, pokemon: [] },
  roughTerrain: { rate: 0, pokemon: [] }, gift: { rate: 0, pokemon: [] }, giftEgg: { rate: 0, pokemon: [] }, onlyOne: { rate: 0, pokemon: [] },
},
  recoverLocation: { x: 23, y: 26 },
  exitReturnMap: MapId.Route1,
  exitReturnPos: {
    x: 11,
    y: 1,
  },
// Trainers para "viridian-city"
// Trainers para "viridian-city"
trainers: [
  {
  npc: cueBall,
  pokemon: [{ id: 19, level: 6 }],
  facing: Direction.Down,
  pos: { x: 12, y: 20 },
  intro: [
    "¡Hemos montado nuestra propia preboda!",
    "¡Con vino barato y sin protocolo!",
    "¡Demuestra que mereces el bueno!"
  ],
  outtro: [
    "...igual el vino caro tampoco está tan mal."
  ],
  money: 80,
  persistent: true,
},
  {
  npc: jrTrainerFemale,
  pokemon: [{ id: 41, level: 7 }],
  facing: Direction.Right,
  pos: { x: 26, y: 24 },
  intro: [
    "¡Nosotros también queremos brindar!",
    "¡Pero solo si nos ganas!"
  ],
  outtro: [
    "¡Felicidades! ¡Brindamos juntos el 8 de agosto!"
  ],
  money: 100,
  persistent: true,
},
  {
  npc: teamRocketGrunt,
  pokemon: [{ id: 33, level: 7 }, { id: 52, level: 6 }],
  facing: Direction.Down,
  pos: { x: 19, y: 12 },
  intro: [
    "¡Con este vino seremos los reyes de la fiesta!",
    "¡No te metas en nuestros asuntos!"
  ],
  outtro: [
    "¡Maldición! Nos retiramos... pero volveremos por el anís."
  ],
  money: 200,
  persistent: true,
  sightRange: 4,
},
  {
  npc: gentleman,
  pokemon: [{ id: 1, level: 1 }],
  facing: Direction.Down,
  pos: { x: 27, y: 22 },
  intro: [

  ],
  outtro: [
    "Joven, el vino tinto cura... y anima.",
    "Toma una botella para el camino.",
    "¡Salud!"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: rocker,
  pokemon: [{ id: 25, level: 1 }],
  facing: Direction.Right,
  pos: { x: 18, y: 8 },
  intro: [

  ],
  outtro: [
    "¡El equipo de sonido ya está enchufado!",
    "¡En cuanto lleguen los novios, esto se lía!"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: lass,
  pokemon: [{ id: 35, level: 3 }],
  facing: Direction.Left,
  pos: { x: 9, y: 4 },
  intro: [

  ],
  outtro: [
    "Llegué la primera. Esta silla ya tiene dueña.",
    "¡A ver si venís más tarde!"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: sailor,
  pokemon: [{ id: 54, level: 5 }],
  facing: Direction.Left,
  pos: { x: 20, y: 21 },
  intro: [

  ],
  outtro: [
    "¡Quieto! ¡Esto es para las fotos del álbum!",
    "¡La luz aquí es perfecta!"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: fisher,
  pokemon: [{ id: 118, level: 7 }, { id: 129, level: 6 }],
  facing: Direction.Down,
  pos: { x: 15, y: 30 },
  intro: [
    "¡No sé dónde es la preboda!",
    "¡Y encima tú te has metido en mi camino!"
  ],
  outtro: [
    "Gracias... Creo que es por aquí."
  ],
  money: 60,
  persistent: true,
}
],
water: {
    24: [8, 9, 10, 11, 12, 13],
    25: [8, 9, 10, 11, 12, 13],
    26: [8, 9, 10, 11, 12, 13],
    27: [8, 9, 10, 11, 12, 13],
  },
};

export default viridianCity;
