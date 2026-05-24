import image from "../assets/map/safari-zone-center.png";
import { MapType } from "./map-types";

const safariZoneCenter: MapType = {
  name: "Zona Safari - Centro",
  image,
  height: 10,
  width: 10,
  start: { x: 5, y: 5 },
  walls: {},
  text: {},
  maps: {},
  exits: {},
  music: "/game/music/maps-original/safari-zone.mp3",
  grass: {},
};

export default safariZoneCenter;
