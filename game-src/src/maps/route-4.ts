import image from "../assets/map/route-4.png";
import { MapId, MapType } from "./map-types";
import { burglar, jrTrainerMale, lass, oak, youngster } from "../app/npcs";
import { Direction } from "../state/state-types";
import { ItemType } from "../app/use-item-data";

const route4: MapType = {
  name: "Ruta 4",
  image,
  height: 18,
  width: 90,
  start: { x: 64, y: 23 },
  walls: {
    1: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
    2: [35, 80],
    3: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 35, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91],
    4: [3, 10, 11, 13, 16, 18, 35],
    5: [3, 10, 12, 13, 16, 17, 19, 23, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89],
    6: [3, 23, 80],
    7: [3, 17, 23, 27, 80],
    8: [3, 23, 80],
    9: [3, 23, 62, 63, 74, 75, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91],
    10: [3, 23, 62, 75],
    11: [3, 23, 62, 75],
    12: [3, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 62, 75, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91],
    13: [3, 41, 62, 75, 80],
    14: [3, 4, 5, 41, 62, 80],
    15: [5, 41, 62, 80],
    16: [5, 14, 15, 16, 17, 18, 19, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85],
    17: [5, 14, 85],
  },
  text: {
    7: {
      17: [
        "MONTE LUNA DE MIEL",
        "¿Quién vuelve a casa así?"
      ],
      27: [
        "Tonto el que lo lea"
      ],
    },
  },
  maps: {},
  exits: {},
  music: "/game/music/maps-original/route-3.mp3",
  grass: {
    10: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
    11: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
    12: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
    13: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
    14: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
    15: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73],
  },
  allowBicycle: true,
  fences: {
    2: [38, 43, 45, 50, 54, 60],
    3: [38, 43, 45, 50, 54, 60],
    4: [38, 43, 45, 50, 54, 60],
    5: [38, 39, 40, 42, 43, 45, 50, 54, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    6: [45, 50, 54],
    7: [4, 5, 6, 7, 45, 50, 54, 55, 56, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    8: [45, 50],
    9: [14, 15, 16, 17, 18, 19, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 76, 77, 78, 79],
    11: [4, 5, 6, 7, 8, 9, 10, 11],
    13: [14, 15, 16, 17, 18, 19, 42, 44, 45, 46, 47, 48, 49, 50, 51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 76, 78, 79],
    15: [6, 7, 8, 9],
    17: [12, 13],
  },
  water: {
    6: [81, 82, 83, 84, 85, 86, 87, 88, 90, 91],
    7: [81, 82, 83, 84, 85, 86, 87, 88, 90, 91],
    8: [81, 82, 83, 84, 85, 86, 87, 88, 90, 91],
  },
  teleports: {
    4: {
      90: { map: MapId.CeruleanCity, pos: { x: 0, y: 12 } },
    },
    5: {
      11: { map: MapId.Route3PokemonCenter, pos: { x: 4, y: 7 } },
      18: { map: MapId.MtMoon1f, pos: { x: 14, y: 35 } },
      24: { map: MapId.MtMoon3f, pos: { x: 27, y: 2 } },
    },
    6: {
      90: { map: MapId.CeruleanCity, pos: { x: 0, y: 14 } },
    },
    7: {
      90: { map: MapId.CeruleanCity, pos: { x: 0, y: 15 } },
    },
    8: {
      90: { map: MapId.CeruleanCity, pos: { x: 0, y: 16 } },
    },
    10: {
      90: { map: MapId.CeruleanCity, pos: { x: 0, y: 18 } },
    },
    11: {
      90: { map: MapId.CeruleanCity, pos: { x: 0, y: 19 } },
    },
    18: {
      6: { map: MapId.Route3, pos: { x: 57, y: 0 } },
      7: { map: MapId.Route3, pos: { x: 58, y: 0 } },
      8: { map: MapId.Route3, pos: { x: 59, y: 0 } },
      9: { map: MapId.Route3, pos: { x: 60, y: 0 } },
      10: { map: MapId.Route3, pos: { x: 60, y: 0 } },
      11: { map: MapId.Route3, pos: { x: 61, y: 0 } },
      12: { map: MapId.Route3, pos: { x: 62, y: 0 } },
      13: { map: MapId.Route3, pos: { x: 63, y: 0 } },
    },
  },
  exitReturnMap: MapId.MtMoon3f,
  exitReturnPos: { x: 37, y: 1 },
  items: [
    {
      item: ItemType.LoveBall,
      pos: { x: 71, y: 3 },
    },
    {
      item: ItemType.MiracleSeed,
      pos: { x: 47, y: 2 },
    },
  ],
  berryTrees: [
    {
      pos: { x: 41, y: 3 },
      item: ItemType.MiracleBerry,
    },
    {
      pos: { x: 57, y: 3 },
      item: ItemType.MiracleBerry,
    },
    {
      pos: { x: 63, y: 3 },
      item: ItemType.MysteryBerry,
    },
  ],
  minimapPos: { x: 120, y: 41 },
  trainers: [
  {
    npc: youngster,
    pokemon: [{ id: 25, level: 29 }, { id: 17, level: 31 }, { id: 180, level: 30 }],
    facing: Direction.Down,
    pos: { x: 55, y: 10 },
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
    pos: { x: 77, y: 10 },
    intro: [
      "Llevoo 100 burpees y 20 gramos de creatina encima.",
      "Te reviento!"
    ],
    outtro: [
      "Donde compras tu mierda??"
    ],
    money: 200,
    persistent: true,
  },
  {
    npc: oak,
    pokemon: [{ id: 122, level: 35 }, { id: 125, level: 37 }, { id: 124, level: 37 }, { id: 154, level: 39 }, { id: 157, level: 39 }, { id: 160, level: 40 }],
    facing: Direction.Right,
    pos: { x: 4, y: 6 },
    intro: [
      "Donde está CORTE?",
      "No hay más masterballs?",
      "Porque no puedo tener otro evee?",
      "Todo llorar..."
    ],
    outtro: [
      "Aún querrás más cosas no??'",
      "Sigue buscando, se han abierto nuevos caminos,",
      "Y nuevos pokémon salvajes han aparecido!"
    ],
    money: 2800,
    persistent: true,
    isGymLeader: true,
    sightRange: 0,
    postGame: {
          message: [
            "¡Toma, para que sigas con tus andanzas!",
            "Gracias por contribuir al juego.",
            "Y por supuesto, a la boda!",
            "¡Bebe más anís!",
          ],
          items: [ItemType.MasterBall, ItemType.Hm01],
        },
  },
  {
    npc: lass,
    pokemon: [{ id: 17, level: 26 }, { id: 20, level: 29 }],
    facing: Direction.Left,
    pos: { x: 13, y: 15 },
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
    npc: burglar,
    pokemon: [{ id: 24, level: 30 }],
    facing: Direction.Left,
    pos: { x: 19, y: 6 },
    intro: [
      "No me invitaron a la boda.",
      "Pero robaré los restos..."
    ],
    outtro: [
      "ay primo!"
    ],
    money: 0,
    persistent: true,
  }
  ],
  fenceDirections: {
    2: {
      38: Direction.Left,
      43: Direction.Right,
      45: Direction.Right,
      50: Direction.Left,
      54: Direction.Left,
      60: Direction.Left,
    },
    3: {
      38: Direction.Left,
      43: Direction.Right,
      45: Direction.Right,
      50: Direction.Left,
      54: Direction.Left,
      60: Direction.Left,
    },
    4: {
      38: Direction.Left,
      43: Direction.Right,
      45: Direction.Right,
      50: Direction.Left,
      54: Direction.Left,
      60: Direction.Left,
    },
    5: {
      45: Direction.Right,
      54: Direction.Left,
    },
    6: {
      45: Direction.Right,
      50: Direction.Left,
      54: Direction.Left,
    },
    7: {
      45: Direction.Right,
      50: Direction.Left,
    },
    8: {
      45: Direction.Right,
      50: Direction.Left,
    },
  },
};

export default route4;
