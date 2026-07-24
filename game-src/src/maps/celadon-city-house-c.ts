import image from "../assets/map/celadon-city-house-c.png";
import { MapId, MapType } from "./map-types";

const celadonCityHouseC: MapType = {
  name: "Casa Ciudad Azulona C",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    1: [0, 1, 7],
    3: [3, 4],
    4: [3, 4],
    6: [0, 7],
    7: [0, 7],
  },
  text: {},
  maps: {},
  exits: {},
  exitReturnMap: MapId.CeladonCity,
  exitReturnPos: { x: 43, y: 28 },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  fences: {},
  teleports: {
    8: {
      2: { map: MapId.CeladonCity, pos: { x: 43, y: 28 } },
      3: { map: MapId.CeladonCity, pos: { x: 43, y: 28 } },
    },
  },
  trainers: [],
};

export default celadonCityHouseC;
