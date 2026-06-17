import image from "../assets/map/vermilion-city-npc-a.png";
import { MapType } from "./map-types";

const vermilionCityFanClub: MapType = {
  name: "Club de Aficionados Pokemon",
  image,
  height: 8,
  width: 8,
  start: { x: 4, y: 6 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7],
    2: [2, 3, 4, 5],
    3: [2, 3, 4, 5],
    4: [2, 3, 4, 5],
  },
  text: {},
  maps: {

  },
  exits: {
    7: [2, 3],
  },
  music: "/game/music/maps-original/vermilion-city.mp3",
  grass: {},
};

export default vermilionCityFanClub;
