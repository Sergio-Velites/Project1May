import image from "../assets/map/pokemon-mansion-1f.png";
import { MapType } from "./map-types";

const pokemonMansion1f: MapType = {
  name: "Mansion Pokemon 1F",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-mansion.mp3",
  grass: {},
};

export default pokemonMansion1f;
