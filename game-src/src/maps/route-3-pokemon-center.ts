import image from "../assets/map/viridian-city-pokemon-center.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import { scientist } from "../app/npcs";

import music from "../assets/music/maps/pokemon-center.mp3";

const route3PokemonCenter: MapType = {
  name: "Centro Pokémon Camino de la Resaca",
  image,
  height: 8,
  width: 14,
  start: {
    x: 4,
    y: 6,
  },
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
        "Si tu cabeza no para de dar vueltas,",
        "¡güárdala en el PC y sigue!",
      ],
    },
  },
  maps: {},
  exits: {
    7: [3, 4],
  },
  music,
  grass: {},
  exitReturnMap: MapId.Route3,
  exitReturnPos: {
    x: 61,
    y: 6,
  },
  pokemonCenter: {
    x: 3,
    y: 2,
  },
  pc: {
    x: 13,
    y: 3,
  },
  onlineBattleNpc: {
    x: 10,
    y: 1,
  },
  trainers: [
    {
      npc: scientist,
      pokemon: [{ id: 1, level: 1 }],
      facing: Direction.Down,
      pos: { x: 10, y: 1 },
      intro: [],
      outtro: [],
      money: 0,
      isOnline: true,
    },
  ],
};

export default route3PokemonCenter;
