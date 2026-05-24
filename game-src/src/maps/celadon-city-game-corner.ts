import image from "../assets/map/celadon-city-game-corner.png";
import { MapType } from "./map-types";

const celadonCityGameCorner: MapType = {
  name: "Salon Recreativo",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/rocket-game-corner.mp3",
  grass: {},
};

export default celadonCityGameCorner;
