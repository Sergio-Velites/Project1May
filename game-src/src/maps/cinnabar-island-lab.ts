import image from "../assets/map/cinnabar-island-lab.png";
import { MapType } from "./map-types";

const cinnabarIslandLab: MapType = {
  name: "Laboratorio de Cinabria",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-lab.mp3",
  grass: {},
};

export default cinnabarIslandLab;
