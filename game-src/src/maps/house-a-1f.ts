import houseA1FImage from "../assets/map/house-a-1f.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import { beauty } from "../app/npcs";

const houseA1f: MapType = {
  name: "House A 1F",
  image: houseA1FImage,
  height: 8,
  width: 8,
  start: {
    x: 3,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 3],
    4: [3, 4],
    5: [3, 4],
    7: [2],
  },
  text: {
    1: {
      3: [
        "Hoy es un día muy especial.",
        "¡El Profesor Oak está esperando!",
      ],
    },
  },
  maps: {
    1: {
      7: MapId.PalletTownHouseA2F,
    },
  },
  exits: {
    7: [2, 3],
  },
  exitReturnPos: {
    x: 5,
    y: 6,
  },
  exitReturnMap: MapId.PalletTown,
  grass: {},
  trainers: [
    {
      npc: beauty,
      pokemon: [{ id: 19, level: 1 }],
      facing: Direction.Up,
      pos: { x: 3, y: 7 },
      intro: [
        "¡{name}!, ¡que coño haces!",
        "¿Te has quedado otra vez jugando?",
        "¡Ya te lo dije! ¡es un día importante!",
        "¡El Profesor Oak te está esperando!",
        "¡Debe llevar ya 8 vinos!",
        "¡Date prisa y no te entretengas más!",
        "¡Yo ya me voy a comprar mucho anís!",
      ],
      outtro: [
        "¡Date prisa! ¡Yo ya me fui!",
      ],
      money: 0,
    },
  ],
};

export default houseA1f;
