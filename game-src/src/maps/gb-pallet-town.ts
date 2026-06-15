import gbPalletTownImage from "../assets/map/gb-pallet-town.png";
import { MapType } from "./map-types";

// MAPA DE DEMOSTRACIÓN (PoC rediseño Game Boy). NO está registrado en
// map-data.ts → es INERTE para el juego; solo aparece en el Map Editor.
// Paredes auto-derivadas de la imagen (tiles distintos al suelo). Revisar/pintar
// en el editor: el agua, la valla y las puertas necesitan ajuste fino.
const gbPalletTown: MapType = {
  name: "PUEBLO PALETA (GB · PoC)",
  allowBicycle: true,
  image: gbPalletTownImage,
  height: 18,
  width: 20,
  start: { x: 8, y: 13 },
  walls: {
    0: [0, 1, 2, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 19],
    2: [1, 18],
    3: [1, 5, 6, 13, 14, 18],
    4: [1, 4, 5, 6, 7, 12, 13, 14, 15, 18],
    5: [1, 4, 5, 6, 7, 12, 13, 14, 15, 18],
    6: [1, 18],
    7: [1, 18],
    8: [1, 11, 12, 13, 14, 18],
    9: [1, 10, 11, 12, 13, 14, 15, 18],
    10: [1, 4, 5, 6, 7, 14, 15, 18],
    11: [1, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 18],
    12: [1, 18],
    13: [1, 18],
    14: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 18],
    15: [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 18],
    16: [1, 2, 3, 4, 5, 6, 7, 18],
    17: [2, 3, 4, 5, 6, 7],
  },
  text: {},
  maps: {},
  exits: {},
  grass: {},
};

export default gbPalletTown;
