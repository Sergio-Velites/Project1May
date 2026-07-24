import image from "../assets/map/celadon-city-poke-mart.png";
import { MapId, MapType } from "./map-types";

const celadonCityPokeMart: MapType = {
  name: "Tienda Pokemon",
  image,
  height: 8,
  width: 20,
  start: { x: 10, y: 6 },
  walls: {},
  text: {},
  maps: {
    1: { 12: MapId.CeladonCityDeptStore2f },
  },
  exits: {
    7: [2, 3, 16, 17],
  },
  exitReturnMap: MapId.CeladonCity,
  exitReturnPos: { x: 10, y: 14 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCityPokeMart;
