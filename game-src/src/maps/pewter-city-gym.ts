import { martaNpc, sailor, sergioNpc } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/pewter-city-gym.png";
import music from "../assets/music/maps/pokemon-gym.mp3";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const pewterCityGym: MapType = {
  name: "Bodega CASTILLO DE MONJARDÍN",
  image,
  music,
  height: 14,
  width: 10,
  start: {
    x: 4,
    y: 12,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 9],
    2: [0, 9],
    3: [0, 1, 2, 3, 6, 7, 8, 9],
    4: [0, 9],
    5: [0, 2, 5, 6, 7, 9],
    6: [0, 9],
    7: [0, 2, 5, 6, 7, 9],
    8: [0, 9],
    9: [0, 1, 2, 3, 6, 7, 8, 9],
    10: [3, 6],
  },
  fences: {},
  grass: {},
  text: {},
  maps: {},
  exits: {
    13: [4, 5],
  },
  exitReturnPos: {
    x: 16,
    y: 18,
  },
  exitReturnMap: MapId.PewterCity,
  trainers: [
    {
      npc: sailor,
      pokemon: [{ id: 72, level: 10 }, { id: 54, level: 10 }],
      money: 300,
      intro: [
        "¡Eh, espera!",
        "¡Esta bodega es solo para los que demuestren su valor!",
        "¡Derrótame primero!",
      ],
      outtro: [
        "Bien... pero dentro te esperan Sergio y Marta.",
        "¡No podrás con ellos!",
      ],
      facing: Direction.Right,
      pos: { x: 3, y: 6 },
    },
    {
      npc: sergioNpc,
      pokemon: [{ id: 58, level: 14 }, { id: 77, level: 12 }],
      money: 1400,
      intro: [
        "¡Te lo advertimos!",
        "Aquí entre barricas solo se habla de vino.",
        "...y de Pokémon.",
        "¡Demuestra que mereces brindar con nosotros!",
      ],
      outtro: [
        "¡Bien hecho!",
        "Nos vemos el 8 de agosto.",
        "Y esta vez tú brindas con nosotros.",
      ],
      facing: Direction.Down,
      pos: { x: 4, y: 1 },
      postGame: {
        message: [
          "¡Toma la INSIGNIA DEL VINO!",
          "Es el símbolo de que mereces brindar.",
          "¡Úsala bien, y que el vino fluya!",
        ],
        items: [ItemType.BoulderBadge, ItemType.Tm34],
      },
    },
    {
      npc: martaNpc,
      pokemon: [{ id: 12, level: 16 }, { id: 36, level: 14 }],
      money: 1600,
      intro: [
        "¡Yo soy Marta!",
        "¡Y no te lo voy a poner fácil!",
        "¡No todo en la boda es vino y flores!",
      ],
      outtro: [
        "¡Increíble! ¡Enhorabuena!",
        "El 8 de agosto... trae buen vino.",
      ],
      facing: Direction.Down,
      pos: { x: 5, y: 1 },
    },
  ],
};

export default pewterCityGym;
