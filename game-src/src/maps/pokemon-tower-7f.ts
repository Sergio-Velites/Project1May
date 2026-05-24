import image from "../assets/map/pokemon-tower-7f.png";
import { MapType } from "./map-types";

const pokemonTower7f: MapType = {
  name: "Torre Pokemon 7F",
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

export default pokemonTower7f;
