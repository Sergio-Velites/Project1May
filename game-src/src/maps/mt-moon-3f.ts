import image from "../assets/map/mt-moon-3f.png";
import music from "../assets/music/maps/mt-moon.mp3";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

// TODO Add propper exit

const mtMoon3f: MapType = {
  name: "Monte Luna de Miel 3F",
  allowBicycle: true,
  image,
  cave: true,
  music,
  height: 36,
  width: 40,
  start: { x: 3, y: 2 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    2: [0, 1, 2, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    3: [0, 1, 2, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    4: [0, 1, 2, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
    5: [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 23, 24, 25, 26, 31, 32, 33, 34, 35],
    6: [0, 1, 8, 17, 18, 19, 23, 26, 31],
    7: [0, 1, 8, 17, 18, 19, 23, 26, 27, 30, 31],
    8: [0, 1, 8, 17, 18, 19, 23, 36, 37, 38, 39],
    9: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 17, 18, 19, 23, 33, 36, 37, 38, 39],
    10: [0, 1, 2, 3, 4, 5, 6, 7, 14, 17, 18, 19, 23, 36, 37, 38, 39],
    11: [0, 1, 2, 3, 4, 5, 6, 7, 14, 15, 16, 17, 18, 19, 23, 36, 37, 38, 39],
    12: [6, 7, 18, 19, 29, 30, 39],
    13: [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 29, 30, 39],
    14: [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 29, 30, 39],
    15: [6, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 24, 25, 28, 29, 30, 31, 34, 35, 39],
    16: [6, 18, 19, 24, 35, 39],
    17: [6, 18, 19, 24, 35, 39],
    18: [6, 18, 19, 24, 35, 39],
    19: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 39],
    20: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 39],
    21: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 39],
    22: [6, 12, 13, 22, 27, 30, 31, 39],
    23: [6, 12, 13, 22, 23, 26, 27, 30, 31, 39],
    24: [6, 12, 13, 30, 31, 39],
    25: [6, 12, 13, 30, 31, 35, 36, 37, 38, 39],
    26: [6, 12, 13, 30, 31, 35],
    27: [6, 12, 13, 30, 31, 35],
    28: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 35],
    29: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 35],
    30: [6, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 35],
    31: [6, 35],
    32: [6, 35],
    33: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35],
  },
  maps: {

  },
  teleports: {
    7: { 5: { map: MapId.MtMoon2f, pos: { x: 17, y: 11 } } },
    9: { 25: { map: MapId.MtMoon2f, pos: { x: 23, y: 3 } } },
    17: { 21: { map: MapId.MtMoon2f, pos: { x: 21, y: 17 } } },
    27: { 15: { map: MapId.MtMoon2f, pos: { x: 13, y: 27 } } },
  },
  exits: {
    // Cámara noreste → salida este de Monte Luna (Ruta 4)
    0: [37, 38],
  },
  exitReturnPos: { x: 24, y: 6 },
  fences: {},
  grass: {},
  text: {},

  encounters: getEncounterData("mt-moon-b1f"),

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

  exitReturnMap: MapId.Route4,
  minimapPos: { x: 99, y: 41 },
};

export default mtMoon3f;
