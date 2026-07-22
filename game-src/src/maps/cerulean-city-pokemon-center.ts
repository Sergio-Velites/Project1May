import image from "../assets/map/cerulean-city-pokemon-center.png";
import { MapId, MapType } from "./map-types";

const ceruleanCityPokemonCenter: MapType = {
  name: "Centro Pokemon",
  image,
  height: 8,
  width: 14,
  start: { x: 7, y: 5 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13],
    1: [0, 1, 2, 5, 6, 7],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13],
    3: [13],
    4: [0],
    5: [0],
    6: [0, 1, 6, 7, 12, 13],
    7: [0, 1, 6, 7, 12, 13],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 19, y: 18 },
  music: "/game/music/maps-original/pokemon-center.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.CeruleanCity, pos: { x: 19, y: 18 } },
      4: { map: MapId.CeruleanCity, pos: { x: 19, y: 18 } },
    },
  },
  pokemonCenter: { x: 3, y: 2 },
  onlineBattleNpc: { x: 11, y: 2 },
  trainers: [],
};

export default ceruleanCityPokemonCenter;
