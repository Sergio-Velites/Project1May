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
  walls: {},
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
  fences: {},
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
};

export default route4;
