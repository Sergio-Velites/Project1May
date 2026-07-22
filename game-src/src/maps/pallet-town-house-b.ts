import { fisher } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import houseBImage from "../assets/map/pallet-town-house-b.png";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const houseB: MapType = {
  name: "Casa B",
  image: houseBImage,
  height: 8,
  width: 8,
  start: { x: 3, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    2: [-1, 8],
    3: [-1, 3, 4, 8],
    4: [-1, 3, 4, 8],
    5: [-1, 8],
    6: [0, 7],
    7: [0, 7],
    8: [1, 4, 5, 6],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnPos: { x: 13, y: 6 },
  exitReturnMap: MapId.PalletTown,
  grass: {},
  // Trainers para "pallet-town-house-b"
trainers: [
  {
    npc: fisher,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 5, y: 5 },
    intro: [],
    outtro: [
      "El puto Peri y Aos se fueron de ",
      "pesca sin mi..."
    ],
    money: 0,
    persistent: true,
  }
  ],
items: [
    {
      item: ItemType.OldRod,
      pos: { x: 4, y: 3 },
    },
  ],
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.PalletTown, pos: { x: 13, y: 6 } },
      3: { map: MapId.PalletTown, pos: { x: 13, y: 6 } },
    },
  },
};

export default houseB;
