import image from "../assets/map/route-10-pokemon-center.png";
import { MapId, MapType } from "./map-types";
import music from "../assets/music/maps/pokemon-center.mp3";

const route10PokemonCenter: MapType = {
  name: "Centro Pokémon Ruta 10",
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
  text: {},
  maps: {},
  exits: {},
  music: music,
  grass: {},
  exitReturnMap: MapId.Route10,
  exitReturnPos: { x: 11, y: 20 },
  pokemonCenter: { x: 3, y: 2 },
  pc: { x: 13, y: 3 },
  onlineBattleNpc: { x: 11, y: 2 },
  trainers: [],
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.Route10, pos: { x: 11, y: 20 } },
      4: { map: MapId.Route10, pos: { x: 11, y: 20 } },
    },
  },
};

export default route10PokemonCenter;
