import image from "../assets/map/pewter-museum-1f.png";
import { MapId, MapType } from "./map-types";

import arodactyl from "../assets/map/pewter-museum-photo-1.png";
import kabutops from "../assets/map/pewter-museum-photo-2.png";

const pewterMuseum1f: MapType = {
  name: "Museo de Villamayor 1F",
  image,
  height: 8,
  width: 20,
  start: {
    x: 10,
    y: 6,
  },
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
    3: {
      2: [
        "FÓSIL DE AERODACTYL",
        "Un PKMN primitivo y muy raro. parece que se mueve"
      ],
    },
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
  maps: {
    7: {
      7: MapId.PewterCityMuseum2f,
    },
  },
  exits: {
    7: [10, 11],
  },
  exitReturnPos: {
    x: 14,
    y: 8,
  },
  exitReturnMap: MapId.PewterCity,
};

export default pewterMuseum1f;
