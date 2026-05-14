import { beauty, gentleman, jrTrainerMale, youngster } from "../app/npcs";
import image from "../assets/map/pewter-city-npc-house.png";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const peweterCityNpcB: MapType = {
  name: "Pewter City NPC House B",
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
    x: 29,
    y: 14,
  },
  exitReturnMap: MapId.PewterCity,
  grass: {},
  // Trainers para "pewter-city-npc-b"
trainers: [
  {
  npc: gentleman,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Down,
  pos: { x: 4, y: 1 },
  intro: [

  ],
  outtro: [
    "Me pregunto si Diego irá con sombrero a la boda..."
  ],
  money: 0,
  persistent: true,
},
  {
  npc: jrTrainerMale,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Up,
  pos: { x: 7, y: 2 },
  intro: [

  ],
  outtro: [
    "Mike llevará su boina??",
    "Fijo que a Eva le hace mucha ilusión"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: youngster,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Right,
  pos: { x: 0, y: 3 },
  intro: [

  ],
  outtro: [
    "En si solo he venido para ver la actuación del cuchillos..."
  ],
  money: 0,
  persistent: true,
},
  {
  npc: beauty,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Right,
  pos: { x: 7, y: 5 },
  intro: [

  ],
  outtro: [
    "Aaaah!",
    "Ufff, menos mal",
    "Pensaba que eras Fer con otro de sus chistes",
    "Por favor no le digas que estoy aquí"
  ],
  money: 0,
  persistent: true,
}
],
};

export default peweterCityNpcB;
