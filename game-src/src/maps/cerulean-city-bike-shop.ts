import image from "../assets/map/cerulean-city-bike-shop.png";
import { MapId, MapType } from "./map-types";
import { blaine, juggler } from "../app/npcs";
import { Direction } from "../state/state-types";

const ceruleanCityBikeShop: MapType = {
  name: "Ciclo Club",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [5],
    2: [5],
    3: [5, 6, 7],
    6: [6],
    7: [7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 13, y: 26 },
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.CeruleanCity, pos: { x: 13, y: 26 } },
      3: { map: MapId.CeruleanCity, pos: { x: 13, y: 26 } },
    },
  },
  trainers: [
  {
    npc: blaine,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 3, y: 3 },
    intro: [],
    outtro: [
      "Querías gastar dinero?",
      "Que pena...",
      "No nos queda stock.",
      "Por si quieres,",
      "puedes invertir!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: juggler,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Right,
    pos: { x: 0, y: 6 },
    intro: [],
    outtro: [
      "Hazte partner!"
    ],
    money: 0,
    persistent: true,
  }
  ],
};

export default ceruleanCityBikeShop;
