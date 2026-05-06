import image from "../assets/map/viridian-city-pokemon-acadamy.png";
import { MapId, MapType } from "./map-types";

const viridianCityAcadamy: MapType = {
  name: "Academia del Soto",
  image,
  height: 8,
  width: 8,
  start: {
    x: 2,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
  text: {
    0: {
      3: [
        "TITULO: EL AMOR Y LOS POKEMON.",
        "Cap. 1: El primer encuentro.",
        "Cap. 2: La batalla del corazon.",
      ],
    },
    4: {
      3: [
        "Encontrado este curioso pokemon.",
        "No sabemos su procedencia",
        "Juraría que le he oído susurrar algo....",
        "'Soy Jonny, Soy Jonny...'",
      ],
    },
  },
  maps: {},
  exits: {
    7: [2, 3],
  },
  grass: {},
  exitReturnMap: MapId.ViridianCity,
  exitReturnPos: {
    x: 21,
    y: 16,
  },
};

export default viridianCityAcadamy;
