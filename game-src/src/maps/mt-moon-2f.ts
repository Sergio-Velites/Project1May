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
  start: { x: 0, y: 0 },
  walls: {
    0: [],
    1: [20, 21, 22, 23, 24, 25, 26, 27],
    2: [19],
    3: [4, 5, 6, 7, 19],
    4: [3, 8, 20, 21, 22, 23, 24, 25, 26, 27],
    5: [3, 8],
    6: [3, 8],
    7: [3, 8, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    8: [3, 8, 13, 26],
    9: [3, 8, 13, 26],
    10: [3, 8, 13, 26],
    11: [3, 8, 13, 26],
    12: [3, 8, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    13: [3, 8, 24, 25, 26, 27],
    14: [3, 8, 23],
    15: [3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23],
    16: [3, 22, 23],
    17: [3, 22, 23],
    18: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23],
    19: [23],
    20: [23],
    21: [23],
    22: [23],
    23: [23],
    24: [23],
    25: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    26: [9],
    27: [9],
  },
  maps: {},
  teleports: {
    7: {
      5: { map: MapId.MtMoon3f, pos: { x: 17, y: 11 } },
    },
    9: {
      25: { map: MapId.MtMoon3f, pos: { x: 23, y: 3 } },
    },
    17: {
      21: { map: MapId.MtMoon3f, pos: { x: 21, y: 17 } },
    },
    27: {
      15: { map: MapId.MtMoon3f, pos: { x: 13, y: 27 } },
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
  trainers: [],
  staticPokemon: [
    {
      pokemonId: 150,
      level: 50,
      sprite: "monster-b",
      pos: { x: 27, y: 3 },
      questId: "mt-moon-3f-static-27-3",
      intro: [
        "Si has llegado hasta aquí eres un auténtico friki.",
        "Muy bien. Suerte en la vida.",
        "Pero ponte a hacer algo con ella.",
        "Sergio y Marta te ven a la vuelta de Japón.",
        "Besos de sus partes!",
        "Ahora pelea contra mí capullo!",
      ],
    },
    {
      pokemonId: 144,
      level: 40,
      sprite: "bird-a",
      pos: { x: 26, y: 27 },
      questId: "mt-moon-3f-static-26-27",
      intro: [
        "Sientes frio...",
        "será por los hielos de los cubatas?",
      ],
    },
    {
      pokemonId: 145,
      level: 40,
      sprite: "bird-a",
      pos: { x: 5, y: 17 },
      questId: "mt-moon-3f-static-5-17",
      intro: [
        "El ambitente es está electrizando...",
        "como en el baile de la boda!",
      ],
    },
    {
      pokemonId: 146,
      level: 40,
      sprite: "bird-a",
      pos: { x: 23, y: 11 },
      questId: "mt-moon-3f-static-23-11",
      intro: [
        "Que calor, que forma de sudar...",
        "pero no más que ayer en el aperitivo...",
      ],
    },
  ],
  minimapPos: { x: 99, y: 41 },
};

export default mtMoon2f;
