import image from "../assets/map/celadon-city-game-corner.png";
import { MapType } from "./map-types";

const celadonCityGameCorner: MapType = {
  name: "Salon Recreativo",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/rocket-game-corner.mp3",
  grass: {},
};

export default celadonCityGameCorner;
