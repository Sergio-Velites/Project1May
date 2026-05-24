import image from "../assets/map/lavender-town.png";
import { MapType } from "./map-types";

const lavenderTown: MapType = {
  name: "Pueblo Lavanda",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/lavender-town.mp3",
  grass: {},
};

export default lavenderTown;
