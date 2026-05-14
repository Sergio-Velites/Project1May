import image from "../assets/map/pewter-city-poke-mart.png";
import { MapId, MapType } from "./map-types";

import music from "../assets/music/maps/pokemon-center.mp3";
import { ItemType } from "../app/use-item-data";

const pewterCityPokeMart: MapType = {
  name: "Tienda de Villamayor",
  image,
  height: 8,
  width: 8,
  start: {
    x: 4,
    y: 6,
  },
  walls: {
    1: [0, 1, 2, 3, 4, 5, 6, 7],
    3: [0, 1, 4, 5, 6, 7],
    4: [1, 4, 5, 6, 7],
    5: [1],
    6: [0, 1],
  },
  text: {},
  maps: {},
  exits: {
    7: [3, 4],
  },
  music,
  grass: {},
  exitReturnMap: MapId.PewterCity,
  exitReturnPos: {
    x: 23,
    y: 18,
  },
  store: {
    x: 1,
    y: 5,
  },
  storeItems: [
    ItemType.PokeBall,
    ItemType.GreatBall,
    ItemType.UltraBall,
    ItemType.Potion,
    ItemType.SuperPotion,
    ItemType.VinoMonjardin,
    ItemType.Antidote,
    ItemType.FireStone,
    ItemType.WaterStone,
    ItemType.ThunderStone,
  ],
};

export default pewterCityPokeMart;
