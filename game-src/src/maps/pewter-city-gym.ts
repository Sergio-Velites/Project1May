import {
  blaine,
  brock,
  erica,
  giovanni,
  koga,
  ltSurge,
  martaNpc,
  misty,
  sabrina,
  sergioNpc,
  tamer,
} from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/pewter-city-gym.png";
import music from "../assets/music/maps/pokemon-gym.mp3";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const pewterCityGym: MapType = {
  name: "Bodega CASTILLO DE MONJARDÍN",
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
    1: [0, 1, 2, 7, 8, 9],
    2: [0, 1, 2, 7, 8, 9],
    3: [0, 1, 2, 7, 8, 9],
    4: [0, 1, 2, 7, 8, 9],
    5: [0, 1, 2, 7, 8, 9],
    6: [0, 1, 2, 7, 8, 9],
    7: [0, 1, 2, 7, 8, 9],
    8: [0, 1, 2, 7, 8, 9],
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
  // ── Trainers ────────────────────────────────────────────────────────
  // La bodega CASTILLO DE MONJARDÍN ha reunido a los 8 antiguos rivales
  // de la pareja en el orden clásico de gimnasios. Hay que derrotarlos
  // a todos para llegar a Sergio y Marta al fondo de la bodega.
// Trainers para "pewter-city-gym"
// Trainers para "pewter-city-gym"
// Trainers para "pewter-city-gym"
trainers: [
  {
  npc: brock,
  pokemon: [{ id: 74, level: 12 }, { id: 95, level: 14 }],
  facing: Direction.Right,
  pos: { x: 4, y: 9 },
  intro: [
    "¡Eh, espera!",
    "Soy BROCK, antiguo líder de lo que antes,",
    "era un gimnasio de roca.",
    "Ahora triunfa el tipo vino.",
    "Hoy custodio la puerta de la bodega.",
    "¡Demuéstrame que mereces brindar con los novios!"
  ],
  outtro: [
    "Roca dura... pero el vino la rompe.",
    "Adelante, te esperan más rivales."
  ],
  money: 200,
  persistent: true,
},
  {
  npc: misty,
  pokemon: [{ id: 120, level: 14 }, { id: 121, level: 17 }],
  facing: Direction.Left,
  pos: { x: 6, y: 8 },
  intro: [
    "¡Vaya, otro invitado curioso!",
    "Soy MISTY. Vine por el cava, me quedé por la fiesta.",
    "Pero antes de seguir... ¡vamos a divertirnos!"
  ],
  outtro: [
    "¡Bien jugado! Brindemos luego con espumoso."
  ],
  money: 400,
  persistent: true,
},
  {
  npc: ltSurge,
  pokemon: [{ id: 100, level: 18 }, { id: 25, level: 18 }],
  facing: Direction.Right,
  pos: { x: 3, y: 7 },
  intro: [
    "¡EH, RECLUTA!",
    "Soy el TENIENTE SURGE.",
    "Aquí no se entra sin ELECTRIZAR el ambiente.",
    "¡EN GUARDIA!"
  ],
  outtro: [
    "¡JA! Buen voltaje el tuyo.",
    "Que SERGIO y MARTA tengan mil años de chispa."
  ],
  money: 800,
  persistent: true,
},
  {
  npc: erica,
  pokemon: [{ id: 71, level: 20 }, { id: 114, level: 20 }, { id: 45, level: 22 }],
  facing: Direction.Left,
  pos: { x: 6, y: 6 },
  intro: [
    "Mmm... el aroma del vino me adormece.",
    "Soy ERICA. He traído flores para la boda.",
    "Pero me apetece un combate... ¿te animas?"
  ],
  outtro: [
    "Qué elegancia.",
    "Brindo por los novios... y por ti."
  ],
  money: 1000,
  persistent: true,
},
  {
  npc: koga,
  pokemon: [{ id: 109, level: 21 }, { id: 89, level: 21 }, { id: 49, level: 23 }],
  facing: Direction.Right,
  pos: { x: 3, y: 5 },
  intro: [
    "FUFUFU... un intruso.",
    "Soy KOGA. Solo los dignos pasan al fondo.",
    "Demuestra tu temple ante mis venenos."
  ],
  outtro: [
    "Hábil... muy hábil.",
    "Que el brindis purifique mi derrota."
  ],
  money: 1200,
  persistent: true,
},
  {
  npc: sabrina,
  pokemon: [{ id: 64, level: 23 }, { id: 65, level: 25 }],
  facing: Direction.Left,
  pos: { x: 6, y: 4 },
  intro: [
    "Te estaba esperando.",
    "Soy SABRINA. Vi tu llegada en mi mente.",
    "Y también vi este combate..."
  ],
  outtro: [
    "El futuro era más amable de lo que predije.",
    "Adelante. SERGIO y MARTA aguardan."
  ],
  money: 1400,
  persistent: true,
},
  {
  npc: blaine,
  pokemon: [{ id: 58, level: 24 }, { id: 78, level: 25 }, { id: 126, level: 27 }],
  facing: Direction.Right,
  pos: { x: 3, y: 3 },
  intro: [
    "¡JA! ¿Vienes a quemarte las manos?",
    "Soy BLAINE. Aquí dentro hace calor.",
    "¡Probemos si tu fuego brilla más que el mío!"
  ],
  outtro: [
    "¡Apagaste mi fuego!",
    "Que la pasión de los novios arda como tú."
  ],
  money: 1700,
  persistent: true,
},
  {
  npc: giovanni,
  pokemon: [{ id: 51, level: 25 }, { id: 31, level: 27 }, { id: 34, level: 27 }, { id: 53, level: 30 }],
  facing: Direction.Left,
  pos: { x: 6, y: 2 },
  intro: [
    "Vaya, vaya... has llegado lejos.",
    "Soy GIOVANNI. El último obstáculo.",
    "Si me derrotas, tendrás el honor de retar a los novios.",
    "Si no... volverás por donde viniste."
  ],
  outtro: [
    "Impresionante.",
    "SERGIO y MARTA eligieron bien a sus invitados.",
    "Adelante. Es tu día."
  ],
  money: 2500,
  persistent: true,
},
  {
  npc: sergioNpc,
  pokemon: [{ id: 58, level: 28 }, { id: 77, level: 28 }],
  facing: Direction.Down,
  pos: { x: 4, y: 1 },
  intro: [
    "¡Lo lograste! Llegaste hasta nosotros.",
    "Soy SERGIO. Hoy me caso con MARTA.",
    "Pero antes... ¡un último brindis con combate!",
    "¡Demuestra que mereces estar en nuestra boda!"
  ],
  outtro: [
    "¡Bien hecho!",
    "Nos vemos el 8 de agosto.",
    "Y esta vez tú brindas con nosotros."
  ],
  money: 2800,
  persistent: true,
  sightRange: 0,
  postGame: {
        message: [
          "¡Toma la INSIGNIA DEL VINO!",
          "Es el símbolo de que mereces brindar.",
          "¡Úsala bien, y que el vino fluya!",
        ],
        items: [ItemType.BoulderBadge, ItemType.Tm34],
      },
},
  {
  npc: martaNpc,
  pokemon: [{ id: 12, level: 28 }, { id: 36, level: 30 }],
  facing: Direction.Down,
  pos: { x: 5, y: 1 },
  intro: [
    "¡Yo soy MARTA!",
    "Y no te creas que SERGIO se lleva todo el mérito.",
    "¡No todo en la boda es vino y flores!",
    "¡Te toca el último combate!"
  ],
  outtro: [
    "¡Increíble! ¡Enhorabuena!",
    "El 8 de agosto... trae buen vino.",
    "Y prepárate para bailar hasta el amanecer."
  ],
  money: 3000,
  persistent: true,
  sightRange: 0,
}
],
};

export default pewterCityGym;
