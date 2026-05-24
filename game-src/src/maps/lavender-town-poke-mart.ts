import image from "../assets/map/lavender-town-poke-mart.png";
import { MapType } from "./map-types";

const lavenderTownPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/lavender-town.mp3",
  grass: {},
};

export default lavenderTownPokeMart;
