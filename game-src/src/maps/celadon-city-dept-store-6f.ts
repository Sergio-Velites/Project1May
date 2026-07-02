import image from "../assets/map/celadon-city-dept-store-6f.png";
import { MapId, MapType } from "./map-types";

const celadonCityDeptStore6f: MapType = {
  name: "Grandes Almacenes 6F",
  image,
  height: 8,
  width: 20,
  start: { x: 10, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 1, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    2: [0, 1, 4, 5, 12, 13, 14, 16, 17, 18, 19],
    3: [0, 1, 4, 5, 18, 19],
    4: [0, 1, 8, 9, 18, 19],
    5: [0, 1, 8, 9, 18, 19],
    6: [0, 1, 18, 19],
    7: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  },
  text: {},
  maps: {

  },
  teleports: {
    2: { 15: { map: MapId.CeladonCityDeptStore5f, pos: { x: 12, y: 1 } } },
  },
  exits: {

  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
  minimapPos: { x: 112, y: 76 },
};

export default celadonCityDeptStore6f;
