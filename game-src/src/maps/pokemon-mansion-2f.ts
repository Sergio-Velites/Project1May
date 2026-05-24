import image from "../assets/map/pokemon-mansion-2f.png";
import { MapType } from "./map-types";

const pokemonMansion2f: MapType = {
  name: "Mansion Pokemon 2F",
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

export default pokemonMansion2f;
