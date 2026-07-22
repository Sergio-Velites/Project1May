import houseA2FImage from "../assets/map/pallet-town-house-a-2f.png";
import { MapId, MapType } from "./map-types";

const houseA2f: MapType = {
  name: "Casa 2F",
  image: houseA2FImage,
  height: 8,
  width: 8,
  start: { x: 6, y: 2 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 2, 8],
    2: [-1, 8],
    3: [-1, 8],
    4: [-1, 3, 8],
    5: [-1, 3, 8],
    6: [0, 6, 8],
    7: [0, 6, 8],
    8: [1, 2, 3, 4, 5, 7, 8],
  },
  text: {
    1: {
      0: [
        "Enciendes el PC.",
        "No funciona..."
      ],
    },
    5: {
      3: [
        "¡Estás jugando al Super Smash Brosh en la Nintendo 64!",
        "... ¡Vamos! ¡Es hora de salir!"
      ],
    },
  },
  maps: {},
  exits: {},
  exitReturnPos: { x: 6, y: 2 },
  exitReturnMap: MapId.PalletTownHouseA1F,
  grass: {},
  fences: {},
  teleports: {
    1: {
      7: { map: MapId.PalletTownHouseA1F, pos: { x: 6, y: 2 } },
    },
  },
  trainers: [],
};

export default houseA2f;
