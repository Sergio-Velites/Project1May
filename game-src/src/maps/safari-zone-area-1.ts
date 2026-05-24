import image from "../assets/map/safari-zone-east.png";
import { MapType } from "./map-types";

const safariZoneArea1: MapType = {
  name: "Zona Safari - Area 1",
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

export default safariZoneArea1;
