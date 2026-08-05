import image from "../assets/map/route-6.png";
import { Direction } from "../state/state-types";import { MapId, MapType } from "./map-types";
import { beauty, fisher, rocker, superNerd, swimmer } from "../app/npcs";
const route6: MapType = {
  name: "Ruta 6",
  image,
  height: 36,
  width: 20,
  start: { x: 9, y: 35 },
  walls: {
    1: [11],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    3: [8, 9, 10, 11, 12, 13],
    4: [8, 9, 10, 11, 12, 13],
    5: [8, 9, 10, 11, 12, 13],
    6: [8, 9, 10, 11, 12, 13],
    7: [8, 9, 11, 12, 13],
    10: [16, 17, 18, 19],
    11: [16, 17, 18, 19],
    12: [16, 17, 18, 19],
    13: [16, 18, 19],
    15: [19],
    28: [0, 1, 2, 3],
    29: [3],
    30: [3],
    31: [3, 4, 5, 6, 7],
    32: [7, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    33: [7, 10],
    34: [7, 10],
    35: [7, 10],
  },
  water: {
    24: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    25: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    26: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    27: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    32: [0, 1, 2, 3, 4, 5, 6],
    33: [0, 1, 2, 3, 4, 5, 6],
    34: [0, 1, 2, 3, 4, 5, 6],
    35: [0, 1, 2, 3, 4, 5, 6],
  },
  fenceDirections: {
    7: {
      0: Direction.Down,
      1: Direction.Down,
      2: Direction.Down,
      4: Direction.Down,
      5: Direction.Down,
      6: Direction.Down,
      7: Direction.Down,
      14: Direction.Down,
      15: Direction.Down,
      16: Direction.Down,
      18: Direction.Down,
      19: Direction.Down,
    },
    11: {
      0: Direction.Down,
      1: Direction.Down,
      2: Direction.Down,
      3: Direction.Down,
      4: Direction.Down,
      5: Direction.Down,
      6: Direction.Down,
      8: Direction.Down,
      9: Direction.Down,
      10: Direction.Down,
      11: Direction.Down,
      12: Direction.Down,
      13: Direction.Down,
      14: Direction.Down,
      15: Direction.Down,
    },
  },
  fences: {
    7: [0, 1, 2, 4, 5, 6, 7, 14, 15, 16, 18, 19],
    11: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15],
  },
  text: {},
  trainers: [
  {
    npc: beauty,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 7, y: 15 },
    intro: [],
    outtro: [
      "Llevo tres horas moviendo este logo dos píxeles. Perfecto."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: rocker,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Down,
    pos: { x: 15, y: 15 },
    intro: [],
    outtro: [
      "¿Propina o petición? Por dos monedas te toco lo que sea."
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: fisher,
    pokemon: [{ id: 98, level: 26 }, { id: 222, level: 27 }],
    facing: Direction.Down,
    pos: { x: 3, y: 15 },
    intro: [
      "Vengo aquí desde crío.",
      "Al mar se le respeta, chaval."
    ],
    outtro: [
      "Buena mano. ¿Seguro que no eres de puerto?"
    ],
    money: 520,
  },
  {
    npc: superNerd,
    pokemon: [{ id: 81, level: 27 }, { id: 100, level: 27 }, { id: 137, level: 28 }],
    facing: Direction.Down,
    pos: { x: 11, y: 15 },
    intro: [
      "En producción todo peta.",
      "Aquí al menos peto yo primero."
    ],
    outtro: [
      "Reproducido el fallo: era yo. Siempre soy yo."
    ],
    money: 540,
  },
  {
    npc: swimmer,
    pokemon: [{ id: 120, level: 27 }, { id: 61, level: 28 }],
    facing: Direction.Down,
    pos: { x: 12, y: 26 },
    intro: [
      "Vigilo la playa… y a los que se creen Michael Phelps."
    ],
    outtro: [
      "Tú nadas… en batallas. En el agua ya veríamos."
    ],
    money: 520,
  }
  ],
  maps: {},
  teleports: {
    7: {
      10: { map: MapId.Route6Gate, pos: { x: 3, y: 4 } },
    },
    13: {
      17: { map: MapId.Route6UndergroundEntrance, pos: { x: 3, y: 6 } },
    },
    35: {
      8: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      9: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      11: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      12: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      13: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      14: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      15: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      16: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      17: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      18: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
      19: { map: MapId.VermilionCity, pos: { x: 19, y: 31 } },
    },
  },
  exits: {},
  music: "/game/music/maps-original/route-3.mp3",
  grass: {},
};

export default route6;
