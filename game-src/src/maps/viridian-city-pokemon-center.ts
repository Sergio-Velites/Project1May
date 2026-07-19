import image from "../assets/map/viridian-city-pokemon-center.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import music from "../assets/music/maps/pokemon-center.mp3";

const viridianCityPokemonCenter: MapType = {
  name: "Centro Pokémon del Soto",
  image,
  height: 8,
  width: 14,
  start: { x: 11, y: 3 },
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
        "¡Bienvenidos, invitados de la boda!",
        "¡Aquí curamos a todos los PKMN gratis!",
        "¡Que disfruten la celebración!"
      ],
    },
  },
  maps: {},
  exits: {},
  music: music,
  grass: {},
  exitReturnMap: MapId.ViridianCity,
  exitReturnPos: { x: 23, y: 26 },
  pokemonCenter: { x: 3, y: 2 },
  pc: { x: 13, y: 3 },
  onlineBattleNpc: { x: 11, y: 2 },
  trainers: [],
  minimapPos: { x: 53, y: 112 },
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.ViridianCity, pos: { x: 23, y: 26 } },
      4: { map: MapId.ViridianCity, pos: { x: 23, y: 26 } },
    },
  },
};

export default viridianCityPokemonCenter;
