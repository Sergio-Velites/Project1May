import image from "../assets/map/cerulean-cave-1f.png";
import { MapId, MapType } from "./map-types";
import { hiker, psychic, pokeManiac, aceTrainerFemale } from "../app/npcs";
import { Direction } from "../state/state-types";

const ceruleanCave1f: MapType = {
  name: "Cueva Celeste 1F",
  image,
  height: 18,
  width: 30,
  start: { x: 17, y: 16 },
  walls: {
    0: [0, 4, 17, 18, 20, 22, 29],
    1: [0, 1, 2, 3, 4, 17, 18, 19, 20, 21, 22, 29],
    2: [0, 1, 2, 3, 4, 17, 18, 19, 20, 21, 22, 29],
    3: [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 20, 21, 22, 24, 25, 26, 27, 28, 29],
    4: [0, 6, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    5: [0, 1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    6: [1, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 26, 27, 28, 29],
    7: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 26, 27, 28, 29],
    8: [0, 7, 8, 9, 10, 19, 20, 26, 27, 28, 29],
    9: [0, 7, 8, 9, 10, 19, 20, 23, 24, 26, 27, 28, 29],
    10: [0, 7, 8, 9, 10, 14, 15, 19, 20, 23, 24, 25, 26, 27, 28, 29],
    11: [0, 5, 6, 7, 8, 9, 10, 14, 15, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29],
    12: [0, 5, 6, 7, 8, 9, 10, 16, 17, 19, 20, 23, 24, 25, 26, 29],
    13: [0, 2, 3, 4, 5, 6, 8, 9, 10, 12, 13, 14, 16, 17, 19, 20, 24, 25, 26, 29],
    14: [3, 4, 8, 9, 10, 11, 12, 14, 19, 26, 29],
    15: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 26, 29],
    16: [0, 7, 8, 9, 10, 11, 12, 13, 14, 18, 19, 20, 26, 29],
    17: [0, 1, 17, 18, 19, 20, 21, 22, 23, 26, 27, 28, 29],
  },
  text: {},
  trainers: [
    {
      npc: hiker,
      pokemon: [{ id: 19, level: 1 }],
      facing: Direction.Down,
      pos: { x: 16, y: 16 },
      intro: [],
      outtro: ["Baja despacio. Aquí el vino y las prisas no se llevan."],
      money: 0,
      persistent: true,
    },
    {
      npc: psychic,
      pokemon: [{ id: 19, level: 1 }],
      facing: Direction.Down,
      pos: { x: 15, y: 14 },
      intro: [],
      outtro: ["Notas de fruta… de roble… y de algo que no debería existir."],
      money: 0,
      persistent: true,
    },
    {
      npc: pokeManiac,
      pokemon: [{ id: 42, level: 32 }, { id: 93, level: 33 }, { id: 169, level: 34 }],
      facing: Direction.Down,
      pos: { x: 13, y: 12 },
      intro: [
        "Busco la cepa prohibida.",
        "Quien estorba… se decanta."
      ],
      outtro: ["Bebes mejor de lo que combato. Y eso me duele."],
      money: 1200,
    },
    {
      npc: aceTrainerFemale,
      pokemon: [{ id: 31, level: 34 }, { id: 94, level: 35 }],
      facing: Direction.Down,
      pos: { x: 12, y: 9 },
      intro: [
        "Nadie llega al fondo sin pasar por mí.",
        "Ni sobrio ni borracho."
      ],
      outtro: ["Pasa… pero no toques la última barrica. Esa es SUYA."],
      money: 1400,
    }
  ],
  staticPokemon: [
    {
      pokemonId: 251,
      level: 40,
      sprite: "grass-b",
      pos: { x: 11, y: 11 },
      questId: "bodega-ancestral-celebi",
      intro: [
        "Entre las barricas más viejas, algo diminuto flota en la penumbra.",
        "Huele a mosto, a bosque… y a suerte.",
        "CELEBI te mira. Parece que llevara esperándote toda la vida.",
      ],
    },
  ],
  maps: {

  },
  teleports: {
    1: { 7: { map: MapId.CeruleanCave2f, pos: { x: 9, y: 1 } }, 27: { map: MapId.CeruleanCave2f, pos: { x: 29, y: 1 } } },
    3: { 1: { map: MapId.CeruleanCave2f, pos: { x: 1, y: 3 } } },
    6: { 0: { map: MapId.CeruleanCave3f, pos: { x: 3, y: 6 } } },
    7: { 23: { map: MapId.CeruleanCave2f, pos: { x: 22, y: 6 } } },
    9: { 18: { map: MapId.CeruleanCave2f, pos: { x: 19, y: 7 } } },
    11: { 3: { map: MapId.CeruleanCave2f, pos: { x: 3, y: 11 } } },
  },
  exits: {
    17: [24, 25],
  },
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 4, y: 12 },
  grass: {},
};

export default ceruleanCave1f;
