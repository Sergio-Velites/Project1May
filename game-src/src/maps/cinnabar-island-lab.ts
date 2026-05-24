import image from "../assets/map/cinnabar-island-lab.png";
import { MapType } from "./map-types";

const cinnabarIslandLab: MapType = {
  name: "Laboratorio de Cinabria",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-lab.mp3",
  grass: {},
};

export default cinnabarIslandLab;
