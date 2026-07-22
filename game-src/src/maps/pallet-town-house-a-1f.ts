import houseA1FImage from "../assets/map/pallet-town-house-a-1f.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import { beauty } from "../app/npcs";
const houseA1f: MapType = {
  name: "Casa 1F",
  image: houseA1FImage,
  height: 8,
  width: 8,
  start: { x: 3, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 3, 8],
    2: [-1, 8],
    3: [-1, 8],
    4: [-1, 3, 4, 8],
    5: [-1, 3, 4, 8],
    6: [-1, 8],
    7: [-1, 8],
    8: [-1, 0, 1, 4, 5, 6, 7, 8],
  },
  text: {
    1: {
      3: [
        "Hoy es un día muy especial.",
        "¡El Profesor Oak está esperando!"
      ],
    },
  },
  maps: {},
  exits: {},
  exitReturnPos: { x: 5, y: 6 },
  exitReturnMap: MapId.PalletTown,
  grass: {},
  trainers: [
  {
    npc: beauty,
    pokemon: [{ id: 19, level: 1 }],
    facing: Direction.Up,
    pos: { x: 6, y: 3 },
    intro: [],
    outtro: [
      "¡Espabila pringao!"
    ],
    money: 0,
    persistent: true,
  }
  ],
  fences: {},
  teleports: {
    1: {
      7: { map: MapId.PalletTownHouseA2F, pos: { x: 7, y: 2 } },
    },
    8: {
      2: { map: MapId.PalletTown, pos: { x: 5, y: 6 } },
      3: { map: MapId.PalletTown, pos: { x: 5, y: 6 } },
    },
  },
};

export default houseA1f;
