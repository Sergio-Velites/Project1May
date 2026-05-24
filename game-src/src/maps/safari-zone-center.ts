import image from "../assets/map/safari-zone-center.png";
import { MapType } from "./map-types";

const safariZoneCenter: MapType = {
  name: "Zona Safari - Centro",
  image,
  height: 36,
  width: 40,
  start: { x: 20, y: 34 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/safari-zone.mp3",
  grass: {},
};

export default safariZoneCenter;
