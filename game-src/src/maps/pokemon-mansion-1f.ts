import image from "../assets/map/pokemon-mansion-1f.png";
import { MapType } from "./map-types";

const pokemonMansion1f: MapType = {
  name: "Mansion Pokemon 1F",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-mansion.mp3",
  grass: {},
};

export default pokemonMansion1f;
