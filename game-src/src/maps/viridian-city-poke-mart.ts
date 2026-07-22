import image from "../assets/map/viridian-city-poke-mart.png";
import { MapId, MapType } from "./map-types";

import music from "../assets/music/maps/pokemon-center.mp3";
import { ItemType } from "../app/use-item-data";

const viridianCityPokeMart: MapType = {
  name: "Tienda del Soto",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 2, 3, 4, 5, 6, 7],
    3: [0, 1, 4, 5, 6, 7],
    4: [0, 1, 4, 5, 6, 7],
    5: [1],
    6: [0, 1],
  },
  text: {},
  maps: {},
  exits: {},
  music: music,
  grass: {},
  exitReturnMap: MapId.ViridianCity,
  exitReturnPos: { x: 29, y: 20 },
  store: { x: 1, y: 5 },
  storeItems: [
    ItemType.PokeBall,
    ItemType.GreatBall,
    ItemType.UltraBall,
    ItemType.VinoMonjardin,
    ItemType.Antidote,
    ItemType.ParlyzHeal,
    ItemType.BurnHeal,
  ],
  fences: {},
  teleports: {
    8: {
      3: { map: MapId.ViridianCity, pos: { x: 29, y: 20 } },
      4: { map: MapId.ViridianCity, pos: { x: 29, y: 20 } },
    },
  },
  trainers: [],
};

export default viridianCityPokeMart;
