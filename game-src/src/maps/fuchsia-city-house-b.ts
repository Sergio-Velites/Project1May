import image from "../assets/map/fuchsia-city-house-b.png";
import { MapId, MapType } from "./map-types";

const fuchsiaCityHouseB: MapType = {
  name: "Casa Ciudad Fucsia",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 3, 4, 5, 6, 7],
    3: [6, 7],
    4: [6, 7],
    7: [7],
  },
  text: {},
  maps: {

  },
  exits: {
    0: [2],
    7: [2, 3],
  },
  exitReturnMap: MapId.FuchsiaCity,
  exitReturnPos: { x: 31, y: 28 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 124, y: 170 },
};

export default fuchsiaCityHouseB;
