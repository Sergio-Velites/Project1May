import image from "../assets/map/route-2-gate.png";
import { MapId, MapType } from "./map-types";

const route2GateNorth: MapType = {
  name: "Control Ruta 2 Norte",
  image,
  height: 8,
  width: 10,
  start: {
    x: 4,
    y: 6,
  },
  walls: {
    0: [0, 1, 2, 3, 4, 6, 7, 8, 9],
    2: [0, 6, 8, 9],
    3: [0, 6, 8, 9],
    4: [0, 9],
    5: [0, 6, 8, 9],
    6: [0, 6, 8, 9],
    7: [0, 9],
  },
  fences: {},
  grass: {},
  text: {},
  

  maps: {},
teleports: {
    0: {
      5: { map: MapId.Route2, pos: { x: 2, y: 12 } },
    },
  },
exits: {
    7: [4, 5],
  },
exitReturnMap: MapId.ViridianForrest,
exitReturnPos: { x: 1, y: 1 },
};

export default route2GateNorth;
