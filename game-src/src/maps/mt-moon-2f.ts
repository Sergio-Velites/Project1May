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
  music,
  cave: true,
  height: 28,
  width: 28,
  start: {
    x: 3,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    3: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    4: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    5: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    6: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    7: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    8: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 26, 27],
    9: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 26, 27],
    10: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 26, 27],
    11: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 26, 27],
    12: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    13: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
    14: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    15: [0, 1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    16: [0, 1, 2, 3, 22, 23],
    17: [0, 1, 2, 3, 22, 23],
    18: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    19: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    20: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    21: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    22: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    23: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    24: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    25: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    26: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    27: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  maps: {
    3: { 23: MapId.MtMoon3f },
    5: { 5: MapId.MtMoon1f },
    9: { 25: MapId.MtMoon1f },
    11: { 17: MapId.MtMoon3f },
    15: { 25: MapId.MtMoon1f },
    17: { 21: MapId.MtMoon3f },
    27: { 13: MapId.MtMoon3f },
  },
  teleports: {

  },
  exits: {
    3: [27],
  },
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
      pokemon: [
        { id: 24, level: 31 },
        { id: 42, level: 32 },
      ],
      facing: Direction.Down,
      pos: { x: 12, y: 2 },
      intro: [
        "¡Robamos el anís del convite!",
        "¡Párate si quieres verlo de nuevo!",
      ],
      outtro: [
        "¡El EQUIPO ROCKET nunca falta",
        "a un saqueo — ni a una boda!",
        "¡Maldición! ¡Mis compis siguen",
        "durmiendo la mona en un rincón!",
      ],
      money: 180,
      persistent: true,
    },
    {
      npc: teamRocketGrunt,
      pokemon: [
        { id: 42, level: 30 },
        { id: 110, level: 33 },
      ],
      facing: Direction.Up,
      pos: { x: 3, y: 8 },
      intro: [
        "¡Buscamos los regalos de los novios!",
        "¡Lárgate, crío, antes de que me caliente!",
      ],
      outtro: [
        "¡Estamos buscando los regalos",
        "de los novios! ¡Lárgate, crío!",
        "Si encuentras algún ANTÍS sin abrir,",
        "¡dánoslo y nos largamos!",
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
        "¡Nadie nos encontrará... hasta ahora!",
      ],
      outtro: [
        "¡Los críos sin resaca",
        "no entenéis el sufrimiento adulto!",
        "MARTA y SERGIO ya andan haciendo",
        "las maletas para JAPÓN… ¡y nosotros aquí!",
      ],
      money: 180,
      persistent: true,
    },
    {
      npc: teamRocketGrunt,
      pokemon: [
        { id: 24, level: 33 },
        { id: 42, level: 31 },
      ],
      facing: Direction.Down,
      pos: { x: 11, y: 16 },
      intro: [
        "¡Lleva tus Pokémon por otro sitio!",
        "¡Este pasillo es nuestro!",
      ],
      outtro: [
        "¡El EQUIPO ROCKET revenderá",
        "todas las botellas vacías del banquete!",
        "¡Me has enfadado!",
        "¡Ya nos vengaremos en TOKIO!",
      ],
      money: 180,
      persistent: true,
    },
    {
      npc: superNerd,
      pokemon: [
        { id: 101, level: 28 },
        { id: 82, level: 29 },
      ],
      facing: Direction.Right,
      pos: { x: 20, y: 14 },
      intro: [
        "Analizo el subsuelo por si el banquete necesita hielo.",
        "¡Pero mi equipo también quiere practicar!",
      ],
      outtro: [
        "¡Eh, para! ¡Estos sushis caíos",
        "de la mesa son míos! ¡Los dos!",
        "¡Vale, uno cada uno!",
        "Que los novios se llevan el resto a JAPÓN.",
      ],
      money: 140,
      persistent: true,
    },
  ],
  staticPokemon: [
    {
      pokemonId: 94,
      level: 35,
      sprite: "monster-b",
      pos: { x: 24, y: 21 },
      questId: "mt-moon-2f-static-24-21",
      intro: ["..."],
    },
    {
      pokemonId: 65,
      level: 35,
      sprite: "monster-a",
      pos: { x: 25, y: 21 },
      questId: "mt-moon-2f-static-25-21",
      intro: ["..."],
    },
    {
      pokemonId: 68,
      level: 35,
      sprite: "monster-a",
      pos: { x: 28, y: 5 },
      questId: "mt-moon-2f-static-28-5",
      intro: ["..."],
    },
    {
      pokemonId: 76,
      level: 35,
      sprite: "monster-b",
      pos: { x: 29, y: 5 },
      questId: "mt-moon-2f-static-29-5",
      intro: ["..."],
    },
  ],
  minimapPos: { x: 126, y: 75 },
};

export default mtMoon2f;
