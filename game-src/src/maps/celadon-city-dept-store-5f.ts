import image from "../assets/map/celadon-city-dept-store-5f.png";
import { MapId, MapType } from "./map-types";

const celadonCityDeptStore5f: MapType = {
  name: "Grandes Almacenes 5F",
  image,
  height: 8,
  width: 20,
  start: { x: 9, y: 7 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18, 19],
    2: [4, 7],
    3: [4, 7, 10, 11, 12, 13, 16, 17, 18, 19],
    4: [4, 5, 6, 7, 10, 11, 12, 13, 16, 17, 18, 19],
    6: [10, 11, 12, 13, 16, 17, 18, 19],
    7: [10, 11, 12, 13, 16, 17, 18, 19],
  },
  text: {},
  maps: {

  },
  teleports: {
    1: { 12: { map: MapId.CeladonCityDeptStore6f, pos: { x: 15, y: 2 } }, 16: { map: MapId.CeladonCityDeptStore4f, pos: { x: 16, y: 1 } } },
  },
  exits: {

  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 112, y: 76 },
};

export default celadonCityDeptStore5f;
