import image from "../assets/map/cerulean-city-npc-b.png";
import { MapType } from "./map-types";

const ceruleanCityHouseB: MapType = {
  name: "Casa Ciudad Celeste",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
};

export default ceruleanCityHouseB;
