import image from "../assets/map/pokemon-mansion-b1f.png";
import { MapType } from "./map-types";

const pokemonMansion4f: MapType = {
  name: "Mansion Pokemon 4F",
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

export default pokemonMansion4f;
