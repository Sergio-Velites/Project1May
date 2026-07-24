import image from "../assets/map/celadon-city-mansion-roof-house.png";
import { MapId, MapType } from "./map-types";

const celadonCityMansionRoofHouse: MapType = {
  name: "Ático Mansión Celadon",
  image,
  height: 8,
  width: 8,
  start: { x: 2, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 3, 7],
    7: [0, 7]
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeladonCity,
  exitReturnPos: { x: 24, y: 10 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    7: {
      2: { map: MapId.CeladonCityMansion3f, pos: { x: 7, y: 2 } },
      3: { map: MapId.CeladonCityMansion3f, pos: { x: 7, y: 2 } },
    },
  },
  trainers: [],
};

export default celadonCityMansionRoofHouse;
