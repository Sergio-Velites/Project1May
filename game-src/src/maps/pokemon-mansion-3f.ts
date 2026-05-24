import image from "../assets/map/pokemon-mansion-3f.png";
import { MapType } from "./map-types";

const pokemonMansion3f: MapType = {
  name: "Mansion Pokemon 3F",
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

export default pokemonMansion3f;
