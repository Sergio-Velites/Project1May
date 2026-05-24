import image from "../assets/map/cinnabar-island-poke-mart.png";
import { MapType } from "./map-types";

const cinnabarIslandPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cinnabar-island.mp3",
  grass: {},
};

export default cinnabarIslandPokeMart;
