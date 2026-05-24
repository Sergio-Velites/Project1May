import image from "../assets/map/cinnabar-island.png";
import { MapType } from "./map-types";

const cinnabarIsland: MapType = {
  name: "Isla Cinabria",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cinnabar-island.mp3",
  grass: {},
};

export default cinnabarIsland;
