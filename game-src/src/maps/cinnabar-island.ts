import image from "../assets/map/cinnabar-island.png";
import { MapType } from "./map-types";

const cinnabarIsland: MapType = {
  name: "Isla Cinabria",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cinnabar-island.mp3",
  grass: {},
};

export default cinnabarIsland;
