import image from "../assets/map/route-4.png";
import { MapId, MapType } from "./map-types";
import { jrTrainerMale, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";
import { ItemType } from "../app/use-item-data";

const route4: MapType = {
  name: "Ruta 4",
  image,
  height: 18,
  width: 71,
  start: { x: 43, y: 23 },
  walls: {
    1: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    2: [14, 59],
    3: [14, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    4: [14],
    5: [2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68],
    6: [2, 59],
    7: [2, 6, 59],
    8: [2, 59],
    9: [2, 41, 42, 53, 54, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    10: [2, 41, 54],
    11: [2, 41, 54],
    12: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 41, 54, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    13: [20, 41, 54, 59],
    14: [20, 41, 59],
    15: [20, 41, 59],
    16: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64],
    17: [64],
  },
  text: {
    7: {
      6: [
        "Tonto el que lo lea"
      ],
    },
  },
  maps: {},
  exits: {
    5: [3],
  },
  music: "/game/music/maps-original/route-3.mp3",
  grass: {
    10: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    11: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    12: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    13: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    14: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
    15: [43, 44, 45, 46, 47, 48, 49, 50, 51, 52],
  },
  allowBicycle: true,
  fences: {
    2: [17, 22, 24, 29, 33, 39],
    3: [17, 22, 24, 29, 33, 39],
    4: [17, 22, 24, 29, 33, 39],
    5: [17, 18, 19, 21, 22, 24, 29, 33, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    6: [24, 29, 33],
    7: [24, 29, 33, 34, 35, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    8: [24, 29],
    9: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 55, 56, 57, 58],
    13: [21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39, 40, 55, 57, 58],
  },
  water: {
    6: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    7: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    8: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
  },
  teleports: {
    4: {
      70: { map: MapId.CeruleanCity, pos: { x: 1, y: 12 } },
    },
    5: {
      70: { map: MapId.CeruleanCity, pos: { x: 1, y: 13 } },
    },
    6: {
      70: { map: MapId.CeruleanCity, pos: { x: 1, y: 14 } },
    },
    7: {
      70: { map: MapId.CeruleanCity, pos: { x: 1, y: 15 } },
    },
    8: {
      70: { map: MapId.CeruleanCity, pos: { x: 1, y: 16 } },
    },
    10: {
      70: { map: MapId.CeruleanCity, pos: { x: 1, y: 18 } },
    },
    11: {
      70: { map: MapId.CeruleanCity, pos: { x: 1, y: 19 } },
    },
  },
  exitReturnMap: MapId.MtMoon3f,
  exitReturnPos: { x: 27, y: 2 },
  items: [
    {
      item: ItemType.LoveBall,
      pos: { x: 50, y: 3 },
    },
    {
      item: ItemType.MiracleSeed,
      pos: { x: 26, y: 2 },
    },
  ],
  berryTrees: [
    {
      pos: { x: 20, y: 3 },
      item: ItemType.Berry,
    },
    {
      pos: { x: 36, y: 3 },
      item: ItemType.BitterBerry,
    },
    {
      pos: { x: 41, y: 3 },
      item: ItemType.MiracleBerry,
    },
  ],
  minimapPos: { x: 122, y: 41 },
  trainers: [
  {
    npc: youngster,
    pokemon: [{ id: 25, level: 29 }, { id: 17, level: 31 }, { id: 180, level: 30 }],
    facing: Direction.Down,
    pos: { x: 34, y: 10 },
    intro: [
      "Se que igual estás algo confundido,",
      "pero si continuas avanzando llegas a Bilbao.",
      "Aunque la ciudad está algo alborotada últimamente....",
      "Algo de una Hyrox he escuchado"
    ],
    outtro: [
      "Ánimo con la Hyrox,",
      "Aunque creo que Hyrox y vino no son buenos compañeros...",
      "Y llevas toda la cara reventada de venas sospechosas...."
    ],
    money: 159,
    persistent: true,
  },
  {
    npc: jrTrainerMale,
    pokemon: [{ id: 106, level: 31 }, { id: 107, level: 32 }, { id: 237, level: 34 }],
    facing: Direction.Down,
    pos: { x: 56, y: 10 },
    intro: [
      "Llevoo 100 burpees y 20 gramos de creatina encima.",
      "Te reviento!"
    ],
    outtro: [
      "Donde compras tu mierda??"
    ],
    money: 200,
    persistent: true,
  }
  ],
  fenceDirections: {
    2: {
      17: Direction.Left,
      22: Direction.Right,
      24: Direction.Right,
      29: Direction.Left,
      33: Direction.Left,
      39: Direction.Left,
    },
    3: {
      17: Direction.Left,
      22: Direction.Right,
      24: Direction.Right,
      29: Direction.Left,
      33: Direction.Left,
      39: Direction.Left,
    },
    4: {
      17: Direction.Left,
      22: Direction.Right,
      24: Direction.Right,
      29: Direction.Left,
      33: Direction.Left,
      39: Direction.Left,
    },
    5: {
      24: Direction.Right,
      33: Direction.Left,
    },
    6: {
      24: Direction.Right,
      29: Direction.Left,
      33: Direction.Left,
    },
    7: {
      24: Direction.Right,
      29: Direction.Left,
    },
    8: {
      24: Direction.Right,
      29: Direction.Left,
    },
  },
};

export default route4;
