import image from "../assets/map/pokemon-mansion-3f.png";
import { MapType } from "./map-types";

const pokemonMansion3f: MapType = {
  name: "Mansion Pokemon 3F",
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

export default pokemonMansion3f;
