import { brock, jrTrainerMale } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/pewter-city-gym.png";
import music from "../assets/music/maps/pokemon-gym.mp3";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const pewterCityGym: MapType = {
  name: "Pewter City Gym",
  image,
  music,
  height: 14,
  width: 10,
  start: {
    x: 4,
    y: 12,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [0, 9],
    2: [0, 9],
    3: [0, 1, 2, 3, 6, 7, 8, 9],
    4: [0, 9],
    5: [0, 2, 5, 6, 7, 9],
    6: [0, 9],
    7: [0, 2, 5, 6, 7, 9],
    8: [0, 9],
    9: [0, 1, 2, 3, 6, 7, 8, 9],
    10: [3, 6],
  },
  fences: {},
  grass: {},
  text: {},
  maps: {},
  exits: {
    13: [4, 5],
  },
  exitReturnPos: {
    x: 16,
    y: 18,
  },
  exitReturnMap: MapId.PewterCity,
  trainers: [
    {
      npc: jrTrainerMale,
      pokemon: [
        {
          id: 50,
          level: 11,
        },
        {
          id: 27,
          level: 11,
        },
      ],
      money: 220,
      intro: [
        "¡Párate ahí, crío!",
        "¡Te faltan años luz para enfrentarte a BROCK!",
      ],
      outtro: ["¡Rediez!", "¡Un año luz no es tiempo, es distancia!"],
      facing: Direction.Right,
      pos: {
        x: 3,
        y: 6,
      },
    },
    {
      npc: brock,
      pokemon: [
        {
          id: 74,
          level: 12,
        },
        {
          id: 95,
          level: 14,
        },
      ],
      money: 1386,
      intro: [
        "¡Soy BROCK, LÍDER del GIMNASIO DE CIUDAD PLATEADA!",
        "¡Creo en la defensa sólida como la roca y en la determinación!",
        "¡Por eso todos mis PKMN son de tipo roca!",
        "¿Sigues queriendo desafiarme?",
        "¡Muy bien! ¡Muéstrame lo mejor que tienes!",
      ],
      outtro: [
        "¡Me has subestimado!",
        "¡Como prueba de tu victoria, toma la MEDALLA ROCA!",
        "¡Es una medalla oficial de la LIGA PKMN!",
        "¡Los PKMN de su portador se vuelven más poderosos!",
        "¡Ahora puedes usar FLASH fuera de combate!",
      ],
      facing: Direction.Down,
      pos: {
        x: 4,
        y: 1,
      },
      postGame: {
        message: [
          "¡Espera, lleva esto contigo!",
          "¡Una MT tiene una técnica que se puede enseñar a un PKMN!",
          "¡Una MT solo se puede usar una vez!",
          "¡Así que elige bien el PKMN al que se la enseñas!",
          "¡La MT34 contiene AGUANTAR!",
          "¡Tu PKMN absorberá el daño recibido",
          "y luego lo devolverá al doble!",
        ],
        items: [ItemType.BoulderBadge, ItemType.Tm34],
      },
    },
  ],
};

export default pewterCityGym;
