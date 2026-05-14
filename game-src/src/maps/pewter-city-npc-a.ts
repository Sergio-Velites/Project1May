import { biker } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/pewter-city-npc-house.png";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const peweterCityNpcA: MapType = {
  name: "Pewter City NPC House A",
  image,
  height: 8,
  width: 8,
  start: {
    x: 3,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
  text: {},
  maps: {},
  exits: {
    7: [2, 3],
  },
  exitReturnPos: {
    x: 7,
    y: 30,
  },
  exitReturnMap: MapId.PewterCity,
  grass: {},
  // Trainers para "pewter-city-npc-a"
trainers: [
  {
  npc: biker,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Left,
  pos: { x: 5, y: 5 },
  intro: [

  ],
  outtro: [
    "Tadej Pogačar:",
    "Pensaba que me invitarían a través de Gudari,",
    "Pero me equivoqué.",
    "Me sobra una bici.",
    "Si la quieres es tuya."
  ],
  money: 0,
  persistent: true,
}
],
  items: [
    {
      item: ItemType.Bicycle,
      pos: { x: 7, y: 5 },
    },
  ],
};

export default peweterCityNpcA;
