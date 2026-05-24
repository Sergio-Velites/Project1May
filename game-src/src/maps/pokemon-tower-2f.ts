import image from "../assets/map/pokemon-tower-2f.png";
import { MapType } from "./map-types";

const pokemonTower2f: MapType = {
  name: "Torre Pokemon 2F",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-tower.mp3",
  grass: {},
};

export default pokemonTower2f;
