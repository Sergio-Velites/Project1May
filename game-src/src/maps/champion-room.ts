import image from "../assets/map/champion-room.png";
import { MapId, MapType } from "./map-types";
import { chetaNpc, chinNpc } from "../app/npcs";
import { Direction } from "../state/state-types";

const championRoom: MapType = {
  name: "Campeon",
  image,
  height: 8,
  width: 8,
  start: { x: 6, y: 6 },
  walls: {
    0: [0, 1, 2, 5, 6, 7],
    1: [0, 2, 5, 7],
    2: [0, 7],
    3: [0, 7],
    4: [0, 7],
    5: [0, 7],
    6: [0, 2, 5, 7],
    7: [0, 1, 2, 5, 6, 7],
  },
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.EliteFour4, pos: { x: 5, y: 0 } },
      4: { map: MapId.EliteFour4, pos: { x: 6, y: 0 } },
    },
  },
  trainers: [
  {
    npc: chinNpc,
    pokemon: [{ id: 146, level: 122 }, { id: 248, level: 129 }, { id: 169, level: 136 }, { id: 144, level: 143 }, { id: 150, level: 150 }, { id: 243, level: 157 }],
    facing: Direction.Down,
    pos: { x: 3, y: 0 },
    intro: [
      "Hola!",
      "Mi nombre es Chin.",
      "Y vengo del futuro, para salvarlo",
      "de algo que pasó en este fecha.",
      "Sabes tu algo?",
      "Conoces a mi padre?"
    ],
    outtro: [
      "Me vuelvo a mi tiempo!"
    ],
    money: 1000,
    persistent: true,
    sightRange: 0,
  },
  {
    npc: chetaNpc,
    pokemon: [{ id: 242, level: 146 }, { id: 145, level: 152 }, { id: 150, level: 158 }, { id: 59, level: 164 }, { id: 103, level: 170 }, { id: 151, level: 176 }],
    facing: Direction.Down,
    pos: { x: 4, y: 0 },
    intro: [
      "Yo soy Cheta. ",
      "Estoy buscando a mi Padre junto con mi hermano ",
      "para evitar que haga una atrozidad.",
      "Venimos de un futuro próximo.",
      "Nos puedes ayudar?"
    ],
    outtro: [
      "Pues parece que la atrocidad se cometerá...",
      "No podemos frenarlo."
    ],
    money: 1000,
    persistent: true,
    sightRange: 0,
  }
  ],
};

export default championRoom;
