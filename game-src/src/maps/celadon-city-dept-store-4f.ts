import image from "../assets/map/celadon-city-dept-store-4f.png";
import { MapId, MapType } from "./map-types";

const celadonCityDeptStore4f: MapType = {
  name: "Grandes Almacenes 4F",
  image,
  height: 8,
  width: 20,
  start: { x: 10, y: 7 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18, 19],
    3: [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17],
    4: [2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17],
    6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17],
    7: [9, 12, 13, 14, 15, 16, 17],
  },
  text: {},
  maps: {

  },
  teleports: {
    1: { 12: { map: MapId.CeladonCityDeptStore3f, pos: { x: 12, y: 1 } }, 16: { map: MapId.CeladonCityDeptStore5f, pos: { x: 16, y: 1 } } },
  },
  exits: {

  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 112, y: 76 },
};

export default celadonCityDeptStore4f;
