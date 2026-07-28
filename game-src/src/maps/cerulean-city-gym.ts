import image from "../assets/map/cerulean-city-gym.png";
import { MapId, MapType } from "./map-types";
import { blackBelt, cueBall, martaNpc, sergioNpc } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import { Direction } from "../state/state-types";

const ceruleanCityGym: MapType = {
  name: "Gimnasio Ciudad Celeste",
  image,
  height: 14,
  width: 10,
  start: { x: 9, y: 13 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [4, 5],
    2: [1, 2, 3, 6, 7, 8],
    3: [1, 8],
    4: [1, 2, 3, 4, 5, 6, 8],
    5: [1, 8],
    6: [1, 3, 4, 6, 7, 8],
    7: [1, 3, 4, 6, 7, 8],
    8: [1, 6, 7, 8],
    9: [1, 2, 3, 6, 7, 8],
    10: [1, 2, 3, 6, 8],
    11: [1, 2, 3, 6, 8],
  },
  text: {},
  trainers: [
  {
    npc: blackBelt,
    pokemon: [{ id: 66, level: 20 }, { id: 57, level: 21 }],
    facing: Direction.Down,
    pos: { x: 4, y: 9 },
    intro: [
      "Bienvenido al gimnasio TIPO HYROX.",
      "Aquí no se corre: se sufre con estilo."
    ],
    outtro: [
      "Bien… pero esto sigue sin ser CrossFit, ¿eh?"
    ],
    money: 420,
  },
  {
    npc: cueBall,
    pokemon: [{ id: 62, level: 21 }, { id: 56, level: 21 }],
    facing: Direction.Down,
    pos: { x: 5, y: 6 },
    intro: [
      "Yo solo reparto agua… y collejas.",
      "Un runner llegó hasta aquí. UNO."
    ],
    outtro: [
      "Te has ganado el gatorade. No el de los buenos."
    ],
    money: 440,
  },
  {
    npc: sergioNpc,
    pokemon: [{ id: 68, level: 23 }, { id: 57, level: 22 }, { id: 237, level: 23 }, { id: 214, level: 24 }],
    facing: Direction.Down,
    pos: { x: 4, y: 2 },
    intro: [
      "¡Anda, si eres tú! MARTA, mira quién se ha colado.",
      "Paramos en Bilbao camino de Japón a competir.",
      "Última pulla y competimos:",
      "un runner es un HYROX que se rindió pronto."
    ],
    outtro: [
      "¡Buah! Y encima sin calentar tú.",
      "Qué vergüenza para el gremio."
    ],
    money: 3000,
    persistent: true,
    sightRange: 0,
    postGame: {
      message: [
        "¡Toma la MEDALLA CELESTE (Hyrox)!",
        "Te la has currado más que muchos con dorsal.",
      ],
      items: [ItemType.CascadeBadge],
    },
    defeatQuestId: "finalista-hyrox",
  },
  {
    npc: martaNpc,
    pokemon: [{ id: 62, level: 22 }, { id: 67, level: 23 }, { id: 106, level: 23 }, { id: 107, level: 24 }],
    facing: Direction.Down,
    pos: { x: 5, y: 2 },
    intro: [
      "¡Soy MARTA! Y no todo lo gana SERGIO, ¿eh?",
      "Nosotros paramos aquí de camino a Japón.",
      "¡Un roto para un descosido!"
    ],
    outtro: [
      "Vale, vale… nos has ganado a los dos.",
      "Nos vemos en la meta. Y en la boda."
    ],
    money: 3000,
    persistent: true,
    sightRange: 0,
  }
  ],
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeruleanCity,
  exitReturnPos: { x: 30, y: 20 },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
  fences: {},
  teleports: {
    13: {
      4: { map: MapId.CeruleanCity, pos: { x: 30, y: 20 } },
      5: { map: MapId.CeruleanCity, pos: { x: 30, y: 20 } },
    },
  },
};

export default ceruleanCityGym;
