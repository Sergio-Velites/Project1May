import image from "../assets/map/cerulean-city-poke-mart.png";
import { MapId, MapType } from "./map-types";
import { jrTrainerFemale } from "../app/npcs";
import { Direction } from "../state/state-types";

const ceruleanCityPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 2, 3, 4, 5, 6, 7],
    3: [0, 1, 4, 5, 6, 7],
    4: [0, 1, 4, 5, 6, 7],
    5: [1],
    6: [0, 1],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 25, y: 26 },
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.CeruleanCity, pos: { x: 25, y: 26 } },
      4: { map: MapId.CeruleanCity, pos: { x: 25, y: 26 } },
    },
  },
  store: { x: 1, y: 5 },
  trainers: [
  {
    npc: jrTrainerFemale,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Right,
    pos: { x: 0, y: 5 },
    intro: [],
    outtro: [
      "..."
    ],
    money: 0,
    persistent: true,
  }
  ],
};

export default ceruleanCityPokeMart;
