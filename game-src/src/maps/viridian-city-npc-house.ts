import image from "../assets/map/viridian-city-npc-house.png";
import { MapId, MapType } from "./map-types";

const viridianCityNpcHouse: MapType = {
  name: "Casa de Ciudad Verde",
  image,
  height: 8,
  width: 8,
  start: { x: 2, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
text: {
    0: {
      3: [
        "No se como acabar con esa plaga... se esconden en las macetas..."
      ],
    },
    1: {
      0: [
        "Tanto leerán?"
      ],
      1: [
        "Más y más libros..."
      ],
      7: [
        "Libros de mierda"
      ],
    },
    7: {
      0: [
        "Aqui no hay nada..."
      ],
    },
  },
  maps: {},
  exits: {},
  grass: {},
  exitReturnMap: MapId.ViridianCity,
  exitReturnPos: { x: 21, y: 10 },
  staticPokemon: [
    {
      pokemonId: 147,
      level: 5,
      sprite: "none",
      pos: { x: 7, y: 7 },
      questId: "viridian-city-npc-house-static-7-7",
    },
  ],
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.ViridianCity, pos: { x: 21, y: 10 } },
      3: { map: MapId.ViridianCity, pos: { x: 21, y: 10 } },
    },
  },
  trainers: [],
};

export default viridianCityNpcHouse;
