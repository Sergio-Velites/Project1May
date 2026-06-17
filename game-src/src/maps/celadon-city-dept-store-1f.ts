import image from "../assets/map/celadon-city-dept-store-1f.png";
import { MapType } from "./map-types";

const celadonCityDeptStore1f: MapType = {
  name: "Grandes Almacenes 1F",
  image,
  height: 8,
  width: 20,
  start: { x: 10, y: 7 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    1: [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19],
    2: [6, 11, 16, 17],
    3: [6, 11],
    4: [6, 7, 8, 9, 10, 11],
  },
  text: {},
  maps: {
    1: { 12: MapId.CeladonCityDeptStore2f },
  },
  exits: {
    7: [2, 3, 16, 17],
  },
  music: "/game/music/maps-original/celadon-city.mp3",
  grass: {},
};

export default celadonCityDeptStore1f;
