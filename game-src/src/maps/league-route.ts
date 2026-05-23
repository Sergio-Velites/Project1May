import { pokeManiac } from "../app/npcs";
import image from "../assets/map/league-route.png";
import { Direction } from "../state/state-types";
import { MapId, MapType } from "./map-types";

const leagueRoute: MapType = {
  name: "Camino a la liga Pokémon",
  image,
  height: 162,
  width: 22,
  start: {
    x: 9,
    y: 266,
  },
  walls: {
  },
  fences: {},
  grass: {},
  text: {
  },
  maps: {},
  exits: {
  },
  exitReturnPos: {
    x: 11,
    y: 6,
  },
  exitReturnMap: MapId.Route22,
  gifts: [

  ],
  // Trainers para "gate-house"
trainers: [

],
};

export default leagueRoute;
