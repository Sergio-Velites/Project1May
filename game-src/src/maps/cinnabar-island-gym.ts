import image from "../assets/map/cinnabar-island-gym.png";
import { MapType } from "./map-types";

const cinnabarIslandGym: MapType = {
  name: "Gimnasio Isla Cinabria",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
};

export default cinnabarIslandGym;
