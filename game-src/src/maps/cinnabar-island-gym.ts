import image from "../assets/map/cinnabar-island-gym.png";
import { MapType } from "./map-types";

const cinnabarIslandGym: MapType = {
  name: "Gimnasio Isla Cinabria",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/pokemon-gym.mp3",
  grass: {},
};

export default cinnabarIslandGym;
