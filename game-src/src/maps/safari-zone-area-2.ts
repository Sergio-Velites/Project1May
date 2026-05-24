import image from "../assets/map/safari-zone-west.png";
import { MapType } from "./map-types";

const safariZoneArea2: MapType = {
  name: "Zona Safari - Area 2",
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

export default safariZoneArea2;
