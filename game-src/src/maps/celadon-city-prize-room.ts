import image from "../assets/map/celadon-city-game-corner-prize-room.png";
import { MapType } from "./map-types";

const celadonCityPrizeRoom: MapType = {
  name: "Sala de Premios",
  image,
  height: 18,
  width: 20,
  start: { x: 10, y: 16 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCityPrizeRoom;
