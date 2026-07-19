import image from "../assets/map/pewter-city-museum-1f.png";
import { MapId, MapType } from "./map-types";

import arodactyl from "../assets/map/pewter-museum-photo-1.png";
import kabutops from "../assets/map/pewter-museum-photo-2.png";
import { superNerd } from "../app/npcs";
import { Direction } from "../state/state-types";

const pewterMuseum1f: MapType = {
  name: "Museo de Villamayor 1F",
  image,
  height: 8,
  width: 20,
  start: { x: 10, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [11, 12, 13, 14, 15, 16, 17, 18, 19],
    2: [1, 2, 3, 4, 11, 12, 16],
    3: [1, 2, 3, 4, 11, 12],
    4: [11],
    5: [1, 2, 3, 4, 8, 11, 12, 13, 14],
    6: [1, 2, 3, 4, 8, 13, 14, 19],
    7: [8, 13, 14, 19],
  },
  fences: {},
  grass: {},
text: {
    4: {
      11: [
        "¡Tómate tu tiempo para mirar!"
      ],
    },
    6: {
      2: [
        "Hay como movidas pero no se muy bien que son"
      ],
    },
  },
  textRewards: {
    3: {
      2: {
        type: "pokemon",
        pokemonId: 142,
        level: 20,
        questId: "text-reward-pewter-city-museum-1f-2-3",
      },
    },
  },
  maps: {},
  teleports: {
    7: {
      7: { map: MapId.PewterCityMuseum2f, pos: { x: 6, y: 7 } },
    },
    8: {
      10: { map: MapId.PewterCity, pos: { x: 14, y: 8 } },
      11: { map: MapId.PewterCity, pos: { x: 14, y: 8 } },
      16: { map: MapId.PewterCity, pos: { x: 19, y: 6 } },
      17: { map: MapId.PewterCity, pos: { x: 19, y: 6 } },
    },
  },
  exits: {},
  exitReturnPos: { x: 14, y: 8 },
  exitReturnMap: MapId.PewterCity,
  staticPokemon: [
    {
      pokemonId: 142,
      level: 20,
      sprite: "none",
      pos: { x: 2, y: 3 },
      questId: "pewter-city-museum-1f-static-2-3",
      intro: [
        "Un fosil de AERODACTYL,",
        "un pokemon antgüo extingido...",
        "un fosil?",
      ],
    },
  ],
  minimapPos: { x: 53, y: 52 },
  trainers: [
  {
    npc: superNerd,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Left,
    pos: { x: 12, y: 4 },
    intro: [],
    outtro: [
      "¡Tómate tu tiempo para mirar!"
    ],
    money: 0,
    persistent: true,
  }
  ],
};

export default pewterMuseum1f;
