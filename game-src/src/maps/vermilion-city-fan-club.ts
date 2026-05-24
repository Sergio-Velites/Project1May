import image from "../assets/map/vermilion-city-npc-a.png";
import { MapType } from "./map-types";

const vermilionCityFanClub: MapType = {
  name: "Club de Aficionados Pokemon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/vermilion-city.mp3",
  grass: {},
};

export default vermilionCityFanClub;
