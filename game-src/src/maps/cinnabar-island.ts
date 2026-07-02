import image from "../assets/map/cinnabar-island.png";
import { MapId, MapType } from "./map-types";

const cinnabarIsland: MapType = {
  name: "Isla Cinabria",
  image,
  height: 18,
  width: 20,
  start: { x: 19, y: 13 },
  walls: {
    0: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19],
    1: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19],
    2: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 14, 15, 16, 17, 18, 19],
    3: [0, 1, 2, 3, 4, 5, 7, 8, 9, 13, 14, 15, 16, 17, 19],
    4: [0, 1, 2, 3],
    5: [0, 1, 2, 3, 9],
    6: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    7: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    8: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    9: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
    10: [0, 1, 2, 3, 10, 11, 12, 13, 14, 15, 16, 17],
    11: [0, 1, 2, 3, 9, 10, 12, 13, 14, 16, 17],
    12: [0, 1, 2, 3, 4, 5],
    13: [0, 1, 2, 3, 4, 5],
    14: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    15: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    16: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    17: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  },
  text: {},
  maps: {
    0: { 10: MapId.Route21, 11: MapId.Route21, 12: MapId.Route21, 13: MapId.Route21 },
    3: { 6: MapId.PokemonMansion1f, 18: MapId.CinnabarIslandGym },
    4: { 19: MapId.Route20 },
    5: { 19: MapId.Route20 },
    6: { 19: MapId.Route20 },
    7: { 19: MapId.Route20 },
    8: { 19: MapId.Route20 },
    9: { 6: MapId.CinnabarIslandLab, 19: MapId.Route20 },
    10: { 19: MapId.Route20 },
    11: { 11: MapId.CinnabarIslandPokemonCenter, 15: MapId.CinnabarIslandPokeMart, 19: MapId.Route20 },
    12: { 19: MapId.Route20 },
    13: { 19: MapId.Route20 },
  },
  exits: {

  },
  music: "/game/music/maps-original/cinnabar-island.mp3",
  grass: {},
  minimapPos: { x: 53, y: 195 },
  flyable: true,
  flySpot: { x: 11, y: 12 },
};

export default cinnabarIsland;
