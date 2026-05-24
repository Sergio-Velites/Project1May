import image from "../assets/map/lavender-town-npc-a.png";
import { MapType } from "./map-types";

const lavenderTownHouseB: MapType = {
  name: "Casa Pueblo Lavanda",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/lavender-town.mp3",
  grass: {},
};

export default lavenderTownHouseB;
