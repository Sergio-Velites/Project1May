import { pokeManiac, scientist, superNerd } from "../app/npcs";
import image from "../assets/map/gate-house.png";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const gateHouse: MapType = {
  name: "Caseta de Control",
  image,
  height: 8,
  width: 10,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 6, 7, 8, 9],
    2: [0, 6, 8, 9],
    3: [0, 6, 8, 9],
    4: [0, 9],
    5: [0, 6, 8, 9],
    6: [0, 6, 8, 9],
    7: [0, 9],
  },
  fences: {},
  grass: {},
  text: {},
  maps: {

  },
  teleports: {

  },
  exits: {
    0: [4, 5],
    7: [4, 5],
  },
  exitReturnMap: MapId.Route22,
  exitReturnPos: { x: 8, y: 6 },
  gifts: [
      {
        pokemonId: 133,
        level: 15,
        pos: { x: 9, y: 2 },
        questId: "gate-house-gift-9-2",
      },
    ],
  trainers: [
    {
    npc: pokeManiac,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Up,
    pos: { x: 8, y: 2 },
    intro: [

    ],
    outtro: [
      "🎵 Llegaré a ser el mejor",
      "el mejor que habra jamás🎵..."
    ],
    money: 0,
    persistent: true,
  },
    {
    npc: superNerd,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 5, y: 1 },
    intro: [

    ],
    outtro: [
      "...",
      "Estás lejos de ser un buen entrenador ",
      "como para pasar por aquí...",
      "Date la vuelta y espabila!"
    ],
    money: 0,
    persistent: true,
    hideCondition: "trainer-defeated:pewter-city-gym-4-1",
  },
    {
    npc: scientist,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 4, y: 1 },
    intro: [

    ],
    outtro: [
      "...",
      "Estás lejos de ser un buen entrenador ",
      "como para pasar por aquí...",
      "Date la vuelta y espabila!"
    ],
    money: 0,
    persistent: true,
    hideCondition: "trainer-defeated:pewter-city-gym-4-1",
  }
  ],
}

export default gateHouse;
