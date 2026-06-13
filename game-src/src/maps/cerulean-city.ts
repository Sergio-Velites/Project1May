import image from "../assets/map/cerulean-city.png";
import { MapType } from "./map-types";
import { scientist, tamer, teamRocketGrunt } from "../app/npcs";
import { Direction } from "../state/state-types";

const ceruleanCity: MapType = {
  name: "Ciudad Celeste",
  image,
  height: 35,
  width: 38,
  start: { x: 20, y: 34 },
  walls: {},
  text: {
    19: {
      21: [
        "La ciudad no es bonita.",
        "Y ya esta.",
        "Pero bueno, hay cosas"
      ],
    },
    21: {
      25: [
        "BEC Bilbao",
        "Hoy hay Hyrox"
      ],
    },
    25: {
      9: [
        "Tienda Velites.",
        "Equípate para tu Hyrox.",
        "Deja aquí tu pasta."
      ],
    },
    29: {
      15: [
        "Tips para una buena Hyrox:",
        "huye!"
      ],
    },
  },
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
  allowBicycle: true,
  flySpot: { x: 20, y: 34 },
  fences: {},
  cuttableTrees: [
    {
      pos: { x: 17, y: 28 },
      questId: "cut-tree-cerulean-city-17-28",
    },
  ],
  boulders: [
    {
      pos: { x: 25, y: 12 },
      id: "boulder-cerulean-city-25-12",
    },
  ],
  minimapPos: { x: 148, y: 41 },
  trainers: [
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 19, y: 9 },
    intro: [],
    outtro: [
      "Deja desarrollar al team rocket!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: teamRocketGrunt,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 18, y: 9 },
    intro: [],
    outtro: [
      "Deja desarrollar al team rocket!"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: tamer,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 28, y: 20 },
    intro: [],
    outtro: [
      "Todavía no es tu hora....",
      "Estás seguro de que puedes mejorar el tiempo de Marta y Sergio?"
    ],
    money: 0,
    persistent: true,
  },
  {
    npc: scientist,
    pokemon: [{ id: 19, level: 2 }],
    facing: Direction.Down,
    pos: { x: 17, y: 29 },
    intro: [],
    outtro: [
      "1+1 son 7... quien me lo iba a decir....",
      "Si...",
      "En efecto...",
      "Solo estoy aquí para molestar"
    ],
    money: 0,
    persistent: true,
  }
  ],
};

export default ceruleanCity;
