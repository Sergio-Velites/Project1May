import image from "../assets/map/pewter-city-pokemon-center.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/pokemon-center.mp3";

const pewterCityPokemonCenter: MapType = {
  name: "Centro Pokémon de Villamayor",
  image,
  height: 8,
  width: 14,
  start: { x: 4, y: 6 },
  walls: {
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
    3: [13],
    4: [0],
    5: [0],
    6: [1, 6, 7, 12, 13],
    7: [1, 6, 7, 12, 13],
  },
  text: {
    4: {
      0: [
        "¡Bostezo!",
        "Cuando Jigglypuff canta, los PKMN se duermen.",
        "...Yo también...",
        "Ronczzz..."
      ],
    },
  },
  maps: {},
  exits: {},
  music: music,
  grass: {},
  exitReturnMap: MapId.PewterCity,
  exitReturnPos: { x: 13, y: 26 },
  pokemonCenter: { x: 3, y: 2 },
  pc: { x: 13, y: 3 },
    onlineBattleNpc: { x: 11, y: 2 },
  trainers: [],
  minimapPos: { x: 53, y: 52 },
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.PewterCity, pos: { x: 13, y: 26 } },
      4: { map: MapId.PewterCity, pos: { x: 13, y: 26 } },
    },
  },
};

export default pewterCityPokemonCenter;
