import image from "../assets/map/route-4.png";
import { MapId, MapType } from "./map-types";
import { jrTrainerMale, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";
import { ItemType } from "../app/use-item-data";

const route4: MapType = {
  name: "Ruta 4",
  image,
  height: 18,
  width: 90,
  start: { x: 43, y: 15 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    3: [0, 1, 2, 3, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    4: [0, 1, 2, 3, 10, 11, 12, 13, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    5: [0, 1, 2, 3, 10, 12, 13, 20, 21, 22, 23, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    6: [0, 1, 2, 3, 21, 22, 23, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    7: [0, 1, 2, 3, 17, 21, 22, 23, 27, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    8: [0, 1, 2, 3, 21, 22, 23, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    9: [0, 1, 2, 3, 21, 22, 23, 62, 63, 74, 75, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    10: [0, 1, 2, 3, 21, 22, 23, 62, 75],
    11: [0, 1, 2, 3, 21, 22, 23, 62, 75],
    12: [0, 1, 2, 3, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 62, 75, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    13: [0, 1, 2, 3, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 62, 75, 80],
    14: [0, 1, 2, 3, 4, 5, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 62, 80],
    15: [0, 1, 2, 3, 4, 5, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 62, 80],
    16: [0, 1, 2, 3, 4, 5, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85],
    17: [0, 1, 2, 3, 4, 5, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85],
  },
  text: {
    7: {
      6: [
        "Tonto el que lo lea"
      ],
    },
  },
  maps: {
    3: { 89: MapId.CeruleanCity },
    4: { 89: MapId.CeruleanCity },
    5: { 11: MapId.Route3PokemonCenter, 18: MapId.MtMoon1f, 24: MapId.MtMoon2f },
    10: { 89: MapId.CeruleanCity },
    11: { 89: MapId.CeruleanCity },
    13: { 89: MapId.CeruleanCity },
    14: { 89: MapId.CeruleanCity },
    15: { 89: MapId.CeruleanCity },
    16: { 89: MapId.CeruleanCity },
    17: { 6: MapId.Route3, 7: MapId.Route3, 8: MapId.Route3, 9: MapId.Route3, 10: MapId.Route3, 11: MapId.Route3, 12: MapId.Route3, 13: MapId.Route3, 14: MapId.Route3, 86: MapId.Route3, 87: MapId.Route3, 88: MapId.Route3, 89: MapId.CeruleanCity },
  },
  exits: {

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
    1: [10, 11, 12, 13, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    2: [14, 38, 43, 45, 50, 54, 60, 80],
    3: [4, 5, 6, 7, 8, 9, 14, 15, 38, 43, 45, 50, 54, 60, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    4: [16, 38, 43, 45, 50, 54, 60],
    5: [16, 17, 19, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 38, 39, 40, 42, 43, 45, 50, 54, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    6: [20, 45, 50, 54],
    7: [4, 5, 6, 7, 20, 45, 50, 54, 55, 56, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    8: [20, 45, 50],
    9: [14, 15, 16, 17, 18, 19, 20, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 76, 77, 78, 79],
    10: [20],
    11: [4, 5, 6, 7, 8, 9, 10, 11, 20],
    12: [20],
    13: [14, 15, 16, 17, 18, 19, 20, 42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 76, 78, 79],
    14: [20],
    15: [6, 7, 8, 9, 20],
    17: [12, 13, 14],
  },
  water: {
    6: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    7: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
    8: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70],
  },
  teleports: {

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
  minimapPos: { x: 148, y: 75 },
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
    1: { 10: Direction.Down, 11: Direction.Down, 12: Direction.Down, 13: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down, 40: Direction.Down, 41: Direction.Down, 42: Direction.Down, 43: Direction.Down, 44: Direction.Down, 45: Direction.Down, 46: Direction.Down, 47: Direction.Down, 48: Direction.Down, 49: Direction.Down, 50: Direction.Down, 51: Direction.Down, 52: Direction.Down, 53: Direction.Down, 54: Direction.Down, 55: Direction.Down, 56: Direction.Down, 57: Direction.Down, 58: Direction.Down, 59: Direction.Down, 60: Direction.Down, 61: Direction.Down, 62: Direction.Down, 63: Direction.Down, 64: Direction.Down, 65: Direction.Down, 66: Direction.Down, 67: Direction.Down, 68: Direction.Down, 69: Direction.Down, 70: Direction.Down, 71: Direction.Down, 72: Direction.Down, 73: Direction.Down, 74: Direction.Down, 75: Direction.Down, 76: Direction.Down, 77: Direction.Down, 78: Direction.Down, 79: Direction.Down },
    2: { 14: Direction.Left, 38: Direction.Left, 43: Direction.Right, 45: Direction.Right, 50: Direction.Left, 54: Direction.Left, 60: Direction.Left, 80: Direction.Left },
    3: { 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 14: Direction.Down, 15: Direction.Down, 38: Direction.Left, 43: Direction.Right, 45: Direction.Right, 50: Direction.Left, 54: Direction.Left, 60: Direction.Left, 80: Direction.Down, 81: Direction.Down, 82: Direction.Down, 83: Direction.Down, 84: Direction.Down, 85: Direction.Down, 86: Direction.Down, 87: Direction.Down, 88: Direction.Down, 89: Direction.Down },
    4: { 16: Direction.Left, 38: Direction.Left, 43: Direction.Right, 45: Direction.Right, 50: Direction.Left, 54: Direction.Left, 60: Direction.Left },
    5: { 16: Direction.Down, 17: Direction.Down, 19: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 35: Direction.Down, 38: Direction.Down, 39: Direction.Down, 40: Direction.Down, 42: Direction.Down, 43: Direction.Down, 45: Direction.Right, 50: Direction.Left, 54: Direction.Left, 60: Direction.Down, 61: Direction.Down, 62: Direction.Down, 63: Direction.Down, 64: Direction.Down, 65: Direction.Down, 66: Direction.Down, 67: Direction.Down, 68: Direction.Down, 69: Direction.Down, 70: Direction.Down, 71: Direction.Down, 72: Direction.Down, 73: Direction.Down, 74: Direction.Down, 75: Direction.Down, 76: Direction.Down, 77: Direction.Down, 78: Direction.Down, 79: Direction.Down },
    6: { 20: Direction.Left, 45: Direction.Right, 50: Direction.Left, 54: Direction.Left },
    7: { 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 20: Direction.Left, 45: Direction.Right, 50: Direction.Left, 54: Direction.Down, 55: Direction.Down, 56: Direction.Down, 58: Direction.Down, 59: Direction.Down, 60: Direction.Down, 61: Direction.Down, 62: Direction.Down, 63: Direction.Down, 64: Direction.Down, 65: Direction.Down, 66: Direction.Down, 67: Direction.Down, 68: Direction.Down, 69: Direction.Down, 70: Direction.Down, 71: Direction.Down, 72: Direction.Down, 73: Direction.Down, 74: Direction.Down, 75: Direction.Down, 76: Direction.Down, 77: Direction.Down, 78: Direction.Down, 79: Direction.Down },
    8: { 20: Direction.Left, 45: Direction.Right, 50: Direction.Left },
    9: { 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Left, 24: Direction.Down, 25: Direction.Down, 26: Direction.Down, 27: Direction.Down, 28: Direction.Down, 29: Direction.Down, 30: Direction.Down, 31: Direction.Down, 32: Direction.Down, 33: Direction.Down, 34: Direction.Down, 36: Direction.Down, 37: Direction.Down, 38: Direction.Down, 39: Direction.Down, 40: Direction.Down, 41: Direction.Down, 42: Direction.Down, 43: Direction.Down, 44: Direction.Down, 45: Direction.Down, 50: Direction.Down, 51: Direction.Down, 52: Direction.Down, 53: Direction.Down, 54: Direction.Down, 55: Direction.Down, 56: Direction.Down, 57: Direction.Down, 58: Direction.Down, 59: Direction.Down, 60: Direction.Down, 64: Direction.Down, 65: Direction.Down, 66: Direction.Down, 67: Direction.Down, 68: Direction.Down, 69: Direction.Down, 70: Direction.Down, 71: Direction.Down, 72: Direction.Down, 73: Direction.Down, 76: Direction.Down, 77: Direction.Down, 78: Direction.Down, 79: Direction.Down },
    10: { 20: Direction.Left },
    11: { 4: Direction.Down, 5: Direction.Down, 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 10: Direction.Down, 11: Direction.Down, 20: Direction.Left },
    12: { 20: Direction.Left },
    13: { 14: Direction.Down, 15: Direction.Down, 16: Direction.Down, 17: Direction.Down, 18: Direction.Down, 19: Direction.Down, 20: Direction.Left, 42: Direction.Down, 44: Direction.Down, 45: Direction.Down, 46: Direction.Down, 47: Direction.Down, 48: Direction.Down, 49: Direction.Down, 50: Direction.Down, 51: Direction.Down, 52: Direction.Down, 54: Direction.Down, 55: Direction.Down, 56: Direction.Down, 57: Direction.Down, 58: Direction.Down, 59: Direction.Down, 60: Direction.Down, 61: Direction.Down, 76: Direction.Down, 78: Direction.Down, 79: Direction.Down },
    14: { 20: Direction.Left },
    15: { 6: Direction.Down, 7: Direction.Down, 8: Direction.Down, 9: Direction.Down, 20: Direction.Left },
    17: { 12: Direction.Down, 13: Direction.Down, 14: Direction.Left },
  },
  flyable: true,
  flySpot: { x: 11, y: 6 },
};

export default route4;
