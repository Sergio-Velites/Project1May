import image from "../assets/map/safari-zone-east.png";
import { MapType } from "./map-types";

const safariZoneArea1: MapType = {
  name: "Zona Safari - Area 1",
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

export default safariZoneArea1;
