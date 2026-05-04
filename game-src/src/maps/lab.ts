import labImage from "../assets/map/lab.png";
import { MapId, MapType } from "./map-types";
import { Direction } from "../state/state-types";
import { oak } from "../app/npcs";

import music from "../assets/music/maps/oaks-laboratory.mp3";

const lab: MapType = {
  name: "Lab",
  image: labImage,
  height: 12,
  width: 10,
  start: {
    x: 5,
    y: 10,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 1, 2, 3, 5, 6, 7, 8, 9],
    3: [6, 7, 8, 9],
    6: [0, 1, 2, 3, 6, 7, 8, 9],
    7: [0, 1, 2, 3, 6, 7, 8, 9],
  },
  text: {
    1: {
      0: ["Enciendes el PC.", "No funciona..."],
      5: [
        "¡Hip! ¡Hoy estamos todos de boda!",
        "¡Elige un POKEMON de la mesa... hip!",
        "¡Y date prisa al BOSQUECILLO!",
        "¡Yo ya voy de buen borraja!",
      ],
    },
  },
  maps: {},
  exits: {
    11: [4, 5],
  },
  exitReturnPos: {
    x: 12,
    y: 12,
  },
  exitReturnMap: MapId.PalletTown,
  music,
  grass: {},
  trainers: [
    {
      npc: oak,
      pokemon: [{ id: 1, level: 5 }],
      facing: Direction.Down,
      pos: { x: 5, y: 1 },
      persistent: true,
      intro: [
        "Hoy no hay tiempo de tonterías.",
        "Pon las pilas que es un día importante.",
        "Te esperan en EL BOSQUECILLO.",
        "hip!",
        "Yo ya voy un tanto borraja.",
        "hip!",
        "Date prisa!",
        "¡Elige uno de los tres POKEMON de la mesa!",
        "He oido que hay un tal Juanre",
        "que no perdona con la comida a los rezagados.",
      ],
      outtro: [
        "¡Buena elección!",
        "¡Date prisa al BOSQUECILLO!",
        "hip!",
      ],
      money: 0,
    },
  ],
};

export default lab;
