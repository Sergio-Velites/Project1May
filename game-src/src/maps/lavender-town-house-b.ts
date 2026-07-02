import image from "../assets/map/lavender-town-house-b.png";
import { MapId, MapType } from "./map-types";

const lavenderTownHouseB: MapType = {
  name: "Casa Pueblo Lavanda",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {},
  text: {},
  maps: {

  },
  exits: {
    7: [3, 4],
  },
  exitReturnMap: MapId.LavenderTown,
  exitReturnPos: { x: 3, y: 14 },
  music: "/game/music/maps-original/lavender-town.mp3",
  grass: {},
  minimapPos: { x: 194, y: 76 },
};

export default lavenderTownHouseB;
