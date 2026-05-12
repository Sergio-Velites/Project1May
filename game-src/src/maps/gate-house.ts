import { pokeManiac } from "../app/npcs";
import image from "../assets/map/gate-house.png";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const gateHouse: MapType = {
  name: "Caseta de Control",
  image,
  height: 8,
  width: 10,
  start: {
    x: 4,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [3, 6],
    6: [3, 6],
    7: [3, 6],
  },
  fences: {},
  grass: {},
  text: {
    0: {
      4: ["La puerta está cerrada."],
      5: ["La puerta está cerrada."],
    },
  },
  maps: {},
  exits: {
    7: [4, 5],
  },
  exitReturnPos: {
    x: 8,
    y: 6,
  },
  exitReturnMap: MapId.Route22,
  gifts: [
    {
      pokemonId: 133,
      level: 15,
      pos: { x: 9, y: 2 },
      questId: "gate-house-gift-9-2",
    },
  ],
  // Trainers para "gate-house"
trainers: [
  {
  npc: pokeManiac,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Up,
  pos: { x: 8, y: 2 },
  intro: [

  ],
  outtro: [
    "🎵 Yegare cualquier lugar",
    "llegaré a cualquier rincón🎵..."
  ],
  money: 0,
  persistent: true,
}
],
};

export default gateHouse;
