import { superNerd, teamRocketGrunt } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/mt-moon-2f.png";
import music from "../assets/music/maps/mt-moon.mp3";
import { Direction } from "../state/state-types";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

const mtMoon2f: MapType = {
  name: "Monte Luna de Miel 2F",
  allowBicycle: true,
  image,
  music: "/game/music/maps-original/mt-moon.mp3",
  cave: true,
  height: 28,
  width: 28,
  start: { x: 4, y: 6 },
  walls: {
    0: [],
    1: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    2: [2, 17, 19],
    3: [2, 17, 19],
    4: [2, 17, 19, 20, 21, 22, 23, 26, 27, 28, 29, 30, 31],
    5: [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 19, 23, 24, 25, 26, 31, 32, 33, 34, 35, 36],
    6: [1, 8, 17, 19, 23, 26, 31, 36],
    7: [1, 8, 17, 19, 23, 26, 27, 30, 31, 36],
    8: [1, 8, 17, 18, 19, 23, 36],
    9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 17, 18, 19, 23, 33, 36],
    10: [7, 14, 17, 18, 19, 23, 36],
    11: [7, 14, 15, 16, 17, 18, 19, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    12: [7, 18, 19, 29, 30, 39],
    13: [7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 29, 30, 39],
    14: [11, 14, 19, 29, 30, 39],
    15: [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 24, 25, 28, 29, 30, 31, 34, 35, 39],
    16: [6, 18, 19, 24, 35, 39],
    17: [6, 18, 19, 24, 35, 39],
    18: [6, 18, 19, 24, 35, 39],
    19: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 39],
    20: [6, 12, 13, 31, 35, 39],
    21: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 39],
    22: [6, 12, 13, 22, 27, 30, 31, 39],
    23: [6, 12, 13, 22, 23, 26, 27, 30, 31, 39],
    24: [6, 12, 13, 30, 31, 39],
    25: [6, 12, 13, 30, 31, 35, 36, 37, 38, 39],
    26: [6, 12, 13, 30, 31, 35],
    27: [6, 12, 13, 30, 31, 35],
    28: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 35],
    29: [6, 12, 22, 23, 24, 25, 26, 31, 35],
    30: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 35],
    31: [6, 35],
    32: [6, 35],
    33: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    34: [],
    35: [],
  },
  maps: {},
  teleports: {
    3: {
      23: { map: MapId.MtMoon3f, pos: { x: 25, y: 9 } },
      27: { map: MapId.MtMoon1f, pos: { x: 1, y: 1 } },
    },
    5: {
      5: { map: MapId.MtMoon1f, pos: { x: 5, y: 6 } },
    },
    9: {
      25: { map: MapId.MtMoon1f, pos: { x: 17, y: 12 } },
    },
    11: {
      17: { map: MapId.MtMoon3f, pos: { x: 5, y: 8 } },
    },
    15: {
      25: { map: MapId.MtMoon1f, pos: { x: 25, y: 16 } },
    },
    17: {
      21: { map: MapId.MtMoon3f, pos: { x: 21, y: 18 } },
    },
    27: {
      13: { map: MapId.MtMoon3f, pos: { x: 15, y: 26 } },
    },
  },
  exits: {},
  exitReturnMap: MapId.MtMoon1f,
  exitReturnPos: { x: 1, y: 1 },
  fences: {},
  grass: {},
  text: {},

  encounters: getEncounterData("mt-moon-b2f"),
  // Trainers para "mt-moon-2f"
  trainers: [
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 24, level: 31 }, { id: 42, level: 32 }],
    facing: Direction.Down,
    pos: { x: 12, y: 2 },
    intro: [
      "¡Robamos el anís del convite!",
      "¡Párate si quieres verlo de nuevo!"
    ],
    outtro: [
      "¡El EQUIPO ROCKET nunca falta",
      "a un saqueo — ni a una boda!",
      "¡Maldición! ¡Mis compis siguen",
      "durmiendo la mona en un rincón!"
    ],
    money: 180,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 42, level: 30 }, { id: 110, level: 33 }],
    facing: Direction.Up,
    pos: { x: 3, y: 8 },
    intro: [
      "¡Buscamos los regalos de los novios!",
      "¡Lárgate, crío, antes de que me caliente!"
    ],
    outtro: [
      "¡Estamos buscando los regalos",
      "de los novios! ¡Lárgate, crío!",
      "Si encuentras algún ANTÍS sin abrir,",
      "¡dánoslo y nos largamos!"
    ],
    money: 180,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 110, level: 28 }],
    facing: Direction.Left,
    pos: { x: 14, y: 18 },
    intro: [
      "¡Con esta cueva tenemos el escondite perfecto!",
      "¡Nadie nos encontrará... hasta ahora!"
    ],
    outtro: [
      "¡Los críos sin resaca",
      "no entenéis el sufrimiento adulto!",
      "MARTA y SERGIO ya andan haciendo",
      "las maletas para JAPÓN… ¡y nosotros aquí!"
    ],
    money: 180,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 24, level: 33 }, { id: 42, level: 31 }],
    facing: Direction.Down,
    pos: { x: 11, y: 16 },
    intro: [
      "¡Lleva tus Pokémon por otro sitio!",
      "¡Este pasillo es nuestro!"
    ],
    outtro: [
      "¡El EQUIPO ROCKET revenderá",
      "todas las botellas vacías del banquete!",
      "¡Me has enfadado!",
      "¡Ya nos vengaremos en TOKIO!"
    ],
    money: 180,
    persistent: true,
  },
  {
    npc: superNerd,
    pokemon: [{ id: 101, level: 28 }, { id: 82, level: 29 }],
    facing: Direction.Right,
    pos: { x: 20, y: 14 },
    intro: [
      "Analizo el subsuelo por si el banquete necesita hielo.",
      "¡Pero mi equipo también quiere practicar!"
    ],
    outtro: [
      "¡Eh, para! ¡Estos sushis caíos",
      "de la mesa son míos! ¡Los dos!",
      "¡Vale, uno cada uno!",
      "Que los novios se llevan el resto a JAPÓN."
    ],
    money: 140,
    persistent: true,
  }
  ],
  staticPokemon: [
    {
      pokemonId: 94,
      level: 35,
      sprite: "monster-b",
      pos: { x: 24, y: 21 },
      questId: "mt-moon-2f-static-24-21",
      intro: [
        "...",
      ],
    },
    {
      pokemonId: 65,
      level: 35,
      sprite: "monster-a",
      pos: { x: 25, y: 21 },
      questId: "mt-moon-2f-static-25-21",
      intro: [
        "...",
      ],
    },
    {
      pokemonId: 68,
      level: 35,
      sprite: "monster-a",
      pos: { x: 28, y: 5 },
      questId: "mt-moon-2f-static-28-5",
      intro: [
        "...",
      ],
    },
    {
      pokemonId: 76,
      level: 35,
      sprite: "monster-b",
      pos: { x: 29, y: 5 },
      questId: "mt-moon-2f-static-29-5",
      intro: [
        "...",
      ],
    },
  ],
  minimapPos: { x: 99, y: 41 },
  items: [
    {
      item: ItemType.HelixFossil,
      pos: { x: 27, y: 27 },
    },
    {
      item: ItemType.DomeFossil,
      pos: { x: 21, y: 27 },
    },
  ],
};

export default mtMoon2f;
