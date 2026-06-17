import image from "../assets/map/celadon-city-dept-store-3f.png";
import { MapType } from "./map-types";

const celadonCityDeptStore3f: MapType = {
  name: "Grandes Almacenes 3F",
  image,
  height: 8,
  width: 20,
  start: { x: 10, y: 7 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18, 19],
    2: [18, 19],
    4: [2, 3, 4, 5, 6, 12, 13, 14, 15, 16, 17, 18, 19],
    5: [12],
    6: [2, 3, 4, 5, 6, 12, 16, 17, 18, 19],
    7: [12, 16, 17, 18, 19],
  },
  text: {},
  maps: {
    1: { 12: MapId.CeladonCityDeptStore4f, 16: MapId.CeladonCityDeptStore2f },
  },
  exits: {

  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCityDeptStore3f;
