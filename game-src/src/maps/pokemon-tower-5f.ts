import image from "../assets/map/pokemon-tower-5f.png";
import { MapType } from "./map-types";

const pokemonTower5f: MapType = {
  name: "Torre Pokemon 5F",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-tower.mp3",
  grass: {},
};

export default pokemonTower5f;
