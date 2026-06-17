import { bugCatcher, hiker, lass, superNerd, youngster } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/mt-moon-1f.png";
import music from "../assets/music/maps/mt-moon.mp3";
import { Direction } from "../state/state-types";
import getEncounterData from "./get-location-data";
import { MapId, MapType } from "./map-types";

const mtMoon1f: MapType = {
  name: "Monte Luna de Miel 1F",
  allowBicycle: true,
  image,
  music,
  cave: true,
  height: 36,
  width: 40,
  maps: {
    5: { 5: MapId.MtMoon2f },
    11: { 17: MapId.MtMoon2f },
    15: { 25: MapId.MtMoon2f },
  },
  teleports: {

  },
  exits: {
    35: [14, 15],
  },
  exitReturnMap: MapId.Route3,
  exitReturnPos: { x: 68, y: 6 },
  start: {
    x: 14,
    y: 34,
  },
  walls: {
    0: [0, 2],
    1: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    2: [0, 12, 38],
    3: [0, 12, 38],
    4: [0, 12, 38],
    5: [0, 12, 38],
    6: [0, 12, 38],
    7: [0, 12, 38],
    8: [0, 12, 18, 22, 26, 38],
    9: [0, 12, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 38],
    10: [0, 12, 18, 38],
    11: [0, 12, 18, 38],
    12: [0, 12, 18, 32, 38],
    13: [0, 12, 18, 19, 32, 38],
    14: [0, 12, 18, 32, 38],
    15: [0, 12, 13, 18, 32, 33, 38],
    16: [0, 18, 22, 32, 38],
    17: [0, 18, 19, 22, 32, 38],
    18: [0, 2, 8, 18, 22, 32, 38],
    19: [0, 2, 3, 4, 5, 6, 7, 8, 18, 22, 23, 32, 33, 38],
    20: [0, 8, 10, 18, 22, 32, 38],
    21: [0, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 22, 32, 38],
    22: [0, 8, 22, 32, 38],
    23: [0, 8, 9, 15, 22, 23, 32, 33, 38],
    24: [0, 22, 32, 38],
    25: [0, 22, 23, 32, 38],
    26: [0, 16, 19, 20, 26, 29, 32, 38],
    27: [0, 16, 19, 20, 21, 22, 23, 26, 29, 32, 33, 38],
    28: [0, 16, 19, 26, 29, 38],
    29: [0, 16, 19, 26, 29, 38],
    30: [0, 10, 13, 16, 19, 26, 29, 38],
    31: [0, 10, 13, 16, 19, 26, 27, 28, 29, 38],
    32: [0, 10, 13, 16, 19, 38],
    33: [0, 10, 13, 16, 19, 38, 39],
    34: [0, 2, 10, 13, 16, 19, 20],
    35: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
  },
  fences: {},
  grass: {},
  text: {
    23: {
      15: [
        "¡Cuidado! ¡Los ZUBAT chupan",
        "más sangre que el barman",
        "de la barra libre de ayer!",
      ],
    },
  },
  encounters: getEncounterData("mt-moon-1f"),
  // Trainers para "mt-moon-1f"
  trainers: [
    {
      npc: bugCatcher,
      pokemon: [
        { id: 11, level: 19 },
        { id: 12, level: 28 },
      ],
      facing: Direction.Down,
      pos: { x: 6, y: 4 },
      intro: [
        "¡Anda anda! ¡Otro invitado perdido en la cueva!",
        "¡Pues paga el peaje!",
      ],
      outtro: [
        "Hay tipos sospechosos en la cueva.",
        "¿O serán invitados perdidos?",
        "¡Vi al EQUIPO ROCKET cargando",
        "con cajas de vino de MONJÁRDÍN!",
      ],
      money: 100,
      persistent: true,
    },
    {
      npc: lass,
      pokemon: [{ id: 39, level: 29 }],
      facing: Direction.Down,
      pos: { x: 4, y: 4 },
      intro: [
        "¿Hay WiFi aquí dentro?",
        "Da igual, ¡batalla conmigo mientras busco cobertura!",
      ],
      outtro: [
        "Estoy esperando a mis amigos…",
        "¡Creíamos volver juntos del banquete!",
        "Dicen que MARTA y SERGIO ya están",
        "buscando hoteles en KIOTO.",
      ],
      money: 110,
      persistent: true,
    },
    {
      npc: superNerd,
      pokemon: [{ id: 101, level: 29 }],
      facing: Direction.Up,
      pos: { x: 33, y: 10 },
      intro: [
        "Analizo la geología de esta cueva para el regalo de boda.",
        "¡Pero primero, un experimento científico!",
      ],
      outtro: [
        "¡Eh! ¡No me grites,",
        "que tengo el cerebro reseco!",
        "Necesito PKMN más fuertes",
        "que mi resaca… imposible.",
      ],
      money: 130,
      persistent: true,
    },
    {
      npc: bugCatcher,
      pokemon: [
        { id: 14, level: 20 },
        { id: 15, level: 28 },
      ],
      facing: Direction.Right,
      pos: { x: 13, y: 29 },
      intro: [
        "¡Me mandaron a buscar anís y encontré esto!",
        "¡Batalla rápida antes de que me llamen!",
      ],
      outtro: [
        "¡Cruza esta cueva y volverás",
        "a CIUDAD CELESTE de luna de miel!",
        "¡Los novios vuelan a JAPÓN!",
        "¡Yo me vuelvo a la cama!",
      ],
      money: 100,
      persistent: true,
    },
    {
      npc: lass,
      pokemon: [{ id: 36, level: 25 }],
      facing: Direction.Down,
      pos: { x: 14, y: 23 },
      intro: [
        "¡Encontré un Clefairy, es buena señal para la boda!",
        "¡Pero primero demuéstra que mereces verlo!",
      ],
      outtro: [
        "¡Madre mía! ¡Esto retumba",
        "como mi cabeza esta mañana!",
        "¿Por dónde se sale?",
        "¡Yo solo quería un café!",
      ],
      money: 110,
      persistent: true,
    },
    {
      npc: hiker,
      pokemon: [
        { id: 75, level: 24 },
        { id: 42, level: 29 },
      ],
      facing: Direction.Down,
      pos: { x: 20, y: 14 },
      intro: [
        "Llevo días explorando. ¿Tú también vienes a la boda?",
        "¡Entonces tendrás que demostrar que eres digno!",
      ],
      outtro: [
        "¡Anda! ¡Menudo susto!",
        "Creía que eras el camarero del BOSQUECILLO",
        "viniendo a cobrarme los chupitos.",
        "¡A vuestra edad ya deberíais",
        "saber controlar el ANTÍS!",
      ],
      money: 130,
      persistent: true,
    },
    {
      npc: youngster,
      pokemon: [{ id: 20, level: 28 }],
      facing: Direction.Right,
      pos: { x: 8, y: 12 },
      intro: [
        "¡La barra libre no es gratis, hay que ganársela!",
        "¡Demuéstrame que mereces tu copa!",
      ],
      outtro: [
        "¿Tú también te has perdido",
        "al volver de la boda?",
        "Yo vine a buscar pareja…",
        "¡pero MARTA y SERGIO ya se llevaron",
        "toda la suerte para JAPÓN!",
      ],
      money: 100,
      persistent: true,
    },
  ],
  items: [
    {
      item: ItemType.Tm12,
      pos: {
        x: 5,
        y: 32,
      },
    },
    {
      item: ItemType.Potion,
      pos: {
        x: 2,
        y: 20,
      },
    },
    {
      item: ItemType.Potion,
      pos: {
        x: 20,
        y: 33,
      },
    },
    {
      item: ItemType.RareCandy,
      pos: {
        x: 35,
        y: 31,
      },
    },
    {
      item: ItemType.MoonStone,
      hidden: true,
      pos: {
        x: 2,
        y: 2,
      },
    },
  ],
  minimapPos: { x: 126, y: 75 },
};

export default mtMoon1f;
