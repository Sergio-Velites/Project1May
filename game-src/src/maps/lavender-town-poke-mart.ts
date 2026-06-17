import image from "../assets/map/lavender-town-poke-mart.png";
import { MapType } from "./map-types";

const lavenderTownPokeMart: MapType = {
  name: "Tienda Pokemon",
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
  maps: {

  },
  exits: {
    7: [3, 4],
  },
  music: "/game/music/maps-original/lavender-town.mp3",
  grass: {},
};

export default lavenderTownPokeMart;
