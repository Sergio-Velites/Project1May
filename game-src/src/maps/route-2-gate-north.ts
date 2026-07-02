import { beauty, blackBelt } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import image from "../assets/map/route-2-gate-north.png";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const route2GateNorth: MapType = {
  name: "Control Ruta 2 Norte",
  image,
  height: 8,
  width: 10,
  start: {
    x: 4,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 6, 7, 8, 9],
    2: [0, 6, 8, 9],
    3: [0, 6, 8, 9],
    4: [0, 9],
    5: [0, 6, 8, 9],
    6: [0, 6, 8, 9],
    7: [0, 9],
  },
  fences: {},
  grass: {},
  text: {},
  

maps: {

  },
teleports: {
    // Norte → VILLAMAYOR DE MONJARDÍN (Pewter)
    0: { 4: { map: MapId.PewterCity, pos: { x: 8, y: 34 } }, 5: { map: MapId.PewterCity, pos: { x: 8, y: 34 } } },
    // Sur → EL BOSQUECILLO (salida norte del bosque)
    7: { 4: { map: MapId.ViridianForrest, pos: { x: 1, y: 1 } }, 5: { map: MapId.ViridianForrest, pos: { x: 1, y: 1 } } },
  },
exits: {},
exitReturnMap: MapId.ViridianForrest,
exitReturnPos: { x: 1, y: 1 },
items: [
    {
      item: ItemType.SuperRod,
      pos: { x: 6, y: 3 },
    },
  ],
  // Trainers para "route-2-gate-north"
// Trainers para "route-2-gate-north"
trainers: [
  {
  npc: beauty,
  pokemon: [{ id: 19, level: 2 }],
  facing: Direction.Left,
  pos: { x: 6, y: 4 },
  intro: [

  ],
  outtro: [
    "Ese capullo del hermano del novio... ",
    "Me intentó echar la caña...",
    "Como si fuera un magikarp...",
    "Y luego salió corriendo hacia VILLAMAYOR DE MONJARDÍN"
  ],
  money: 0,
  persistent: true,
},
  {
  npc: blackBelt,
  pokemon: [{ id: 68, level: 20 }],
  facing: Direction.Left,
  pos: { x: 7, y: 1 },
  intro: [
    "Antes me hacía llamar Berrito...",
    "Pero gracias a gym Unav,",
    "Hoy vengo de incógnito!",
    "Ssshhhh no se lo digas a nadie"
  ],
  outtro: [
    "Como me jode que la boda no sea en Zentral..."
  ],
  money: 99995,
  persistent: true,
}
],
  minimapPos: { x: 53, y: 66 },
};

export default route2GateNorth;
