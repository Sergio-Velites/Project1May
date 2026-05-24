import image from "../assets/map/cerulean-city-npc-b.png";
import { MapType } from "./map-types";

const ceruleanCityHouseB: MapType = {
  name: "Casa Ciudad Celeste",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/cerulean-city.mp3",
  grass: {},
};

export default ceruleanCityHouseB;
