import image from "../assets/map/vermilion-city-gym.png";
import { MapId, MapType } from "./map-types";
import { superNerd, engineer, ltSurge } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import { Direction } from "../state/state-types";

const vermilionCityGym: MapType = {
  name: "Gimnasio Ciudad Carmin",
  image,
  height: 18,
  width: 10,
  start: { x: 9, y: 16 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 1, 6, 7, 8, 9],
    2: [0, 1, 8, 9],
    3: [0, 1, 8, 9],
    4: [0, 1, 2, 3, 6, 7, 8, 9],
    5: [0, 1, 2, 3, 6, 7, 8, 9],
    7: [1, 3, 5, 7, 9],
    9: [1, 3, 5, 7, 9],
    11: [1, 3, 5, 7, 9],
    13: [3, 6],
    14: [3, 6],
  },
  text: {},
  trainers: [
    {
      npc: superNerd,
      pokemon: [{ id: 81, level: 30 }, { id: 100, level: 30 }],
      facing: Direction.Down,
      pos: { x: 4, y: 11 },
      intro: [
        "Bienvenido al ESTUDIO. Aquí se crea… y se combate.",
        "¿Traes brief? No. Valiente."
      ],
      outtro: ["Vale, iteramos. La próxima gano yo."],
      money: 600,
    },
    {
      npc: engineer,
      pokemon: [{ id: 82, level: 32 }, { id: 101, level: 32 }],
      facing: Direction.Down,
      pos: { x: 4, y: 7 },
      intro: [
        "Soldé, imprimí y versioné mi equipo.",
        "El tuyo… ¿tiene backup?"
      ],
      outtro: ["Rollback aceptado. Enhorabuena."],
      money: 640,
    },
    {
      npc: ltSurge,
      pokemon: [{ id: 82, level: 32 }, { id: 101, level: 32 }, { id: 233, level: 33 }, { id: 26, level: 34 }],
      facing: Direction.Down,
      pos: { x: 4, y: 2 },
      intro: [
        "Soy EL CREADOR. Este estudio lo monté en un finde.",
        "Mi equipo está optimizado, versionado y con backup.",
        "El deadline era ayer. ¿Empezamos?"
      ],
      outtro: [
        "Vaya… esto no estaba en el roadmap."
      ],
      money: 3400,
      persistent: true,
      sightRange: 0,
      postGame: {
        message: [
          "¡Toma la MEDALLA CARMÍN!",
          "Te la has renderizado en tiempo récord.",
        ],
        items: [ItemType.ThunderBadge, ItemType.Tm34],
      },
    }
  ],
  maps: {

  },
  exits: {
    17: [4, 5],
  },
  exitReturnMap: MapId.VermilionCity,
  exitReturnPos: { x: 12, y: 20 },
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
};

export default vermilionCityGym;
