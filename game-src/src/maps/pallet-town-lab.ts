import labImage from "../assets/map/pallet-town-lab.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import { oak } from "../app/npcs";
import music from "../assets/music/maps/oaks-laboratory.mp3";

const lab: MapType = {
  name: "DESTILERÍA DEL PROF. OAK",
  image: labImage,
  music: music,
  height: 12,
  width: 10,
  start: { x: 5, y: 10 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 1, 2, 3, 6, 7, 8, 9],
    2: [-1, 10],
    3: [-1, 6, 7, 8, 10],
    4: [-1, 10],
    5: [-1, 10],
    6: [0, 1, 2, 3, 6, 7, 8, 9],
    7: [0, 1, 2, 3, 6, 7, 8, 9],
    8: [-1, 10],
    9: [-1, 10],
    10: [-1, 10],
    11: [-1, 10],
    12: [0, 1, 2, 3, 6, 7, 8, 9, 10],
  },
  fences: {},
  grass: {},
  text: {
    1: {
      0: [
        "Enciendes el PC.",
        "No funciona...",
        "Qué castaña"
      ],
    },
  },
  maps: {},
  exits: {},
  exitReturnMap: MapId.PalletTown,
  exitReturnPos: { x: 12, y: 12 },
  trainers: [
  {
    npc: oak,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 5, y: 1 },
    intro: [],
    outtro: [
      "¡Hip! ¡Hoy estamos todos de boda!",
      "¡Elige un POKEMON de la mesa... hip!",
      "¡Y date prisa al BOSQUECILLO!",
      "¡Yo ya estoy borraja!"
    ],
    money: 0,
    persistent: true,
    hideCondition: "trainer-defeated:pewter-city-gym-4-1",
  }
  ],
  teleports: {
    12: {
      4: { map: MapId.PalletTown, pos: { x: 12, y: 12 } },
      5: { map: MapId.PalletTown, pos: { x: 12, y: 12 } },
    },
  },
}

export default lab;
