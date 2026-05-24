import gateHouse from "./gate-house";
import leagueRoute from "./league-route";
import houseA1f from "./house-a-1f";
import houseA2f from "./house-a-2f";
import houseB from "./house-b";
import lab from "./lab";
import { MapId, MapType } from "./map-types";
import palletTown from "./pallet-town";
import route1 from "./route-1";
import route2 from "./route-2";
import route2Gate from "./route-2-gate";
import route22 from "./route-22";
import viridianForrest from "./viridian-forrest";
import viridianCity from "./viridian-city";
import viridianCityAcadamy from "./viridian-city-acadamy";
import viridianCityGym from "./viridian-city-gym";
import viridianCityNpcHouse from "./viridian-city-npc-house";
import viridianCityPokeMart from "./viridian-city-poke-mart";
import viridianCityPokemonCenter from "./viridian-city-pokemon-center";
import pewterCity from "./pewter-city";
import route2GateNorth from "./route-2-gate-north";
import pewterCityPokeMart from "./pewter-city-poke-mart";
import pewterCityPokemonCenter from "./pewter-city-pokemon-center";
import peweterCityNpcA from "./pewter-city-npc-a";
import peweterCityNpcB from "./pewter-city-npc-b";
import pewterCityGym from "./pewter-city-gym";
import pewterMuseum1f from "./pewter-museum-1f";
import pewterMuseum2f from "./pewter-museum-2f";
import route3 from "./route-3";
import route3PokemonCenter from "./route-3-pokemon-center";
import mtMoon1f from "./mt-moon-1f";
import mtMoon2f from "./mt-moon-2f";
import mtMoon3f from "./mt-moon-3f";

// ── Rutas nuevas ─────────────────────────────────────────────────────────────
import route4 from "./route-4";
import route5 from "./route-5";
import route6 from "./route-6";
import route7 from "./route-7";
import route8 from "./route-8";
import route9 from "./route-9";
import route10 from "./route-10";
import route11 from "./route-11";
import route12 from "./route-12";
import route13 from "./route-13";
import route14 from "./route-14";
import route15 from "./route-15";
import route16 from "./route-16";
import route17 from "./route-17";
import route18 from "./route-18";
import route19 from "./route-19";
import route20 from "./route-20";
import route21 from "./route-21";
import route23 from "./route-23";
import route24 from "./route-24";
import route25 from "./route-25";

// ── Casetas / caminos subterráneos ────────────────────────────────────────────
import route4Gate from "./route-4-gate";
import undergroundPathNS from "./underground-path-ns";
import undergroundPathEW from "./underground-path-ew";
import route12Gate from "./route-12-gate";
import route15Gate from "./route-15-gate";
import route16Gate from "./route-16-gate";

// ── Ciudad Celeste ────────────────────────────────────────────────────────────
import ceruleanCity from "./cerulean-city";
import ceruleanCityPokemonCenter from "./cerulean-city-pokemon-center";
import ceruleanCityPokeMart from "./cerulean-city-poke-mart";
import ceruleanCityGym from "./cerulean-city-gym";
import ceruleanCityBikeShop from "./cerulean-city-bike-shop";
import ceruleanCityHouseA from "./cerulean-city-house-a";
import ceruleanCityHouseB from "./cerulean-city-house-b";

// ── Ciudad Carmín ─────────────────────────────────────────────────────────────
import vermilionCity from "./vermilion-city";
import vermilionCityPokemonCenter from "./vermilion-city-pokemon-center";
import vermilionCityPokeMart from "./vermilion-city-poke-mart";
import vermilionCityGym from "./vermilion-city-gym";
import vermilionCityFanClub from "./vermilion-city-fan-club";
import vermilionCityHouseA from "./vermilion-city-house-a";
import vermilionCityHouseB from "./vermilion-city-house-b";

// ── S.S. Aguamarina ───────────────────────────────────────────────────────────
import ssAnneBf1 from "./ss-anne-bf1";
import ssAnne1f from "./ss-anne-1f";
import ssAnne2f from "./ss-anne-2f";
import ssAnne3f from "./ss-anne-3f";

// ── Cueva Diglett ─────────────────────────────────────────────────────────────
import digletsCave from "./diglets-cave";

// ── Túnel Roca ────────────────────────────────────────────────────────────────
import rockTunnel1f from "./rock-tunnel-1f";
import rockTunnel2f from "./rock-tunnel-2f";

// ── Pueblo Lavanda ────────────────────────────────────────────────────────────
import lavenderTown from "./lavender-town";
import lavenderTownPokemonCenter from "./lavender-town-pokemon-center";
import lavenderTownPokeMart from "./lavender-town-poke-mart";
import lavenderTownHouseA from "./lavender-town-house-a";
import lavenderTownHouseB from "./lavender-town-house-b";

// ── Torre Pokémon ─────────────────────────────────────────────────────────────
import pokemonTower1f from "./pokemon-tower-1f";
import pokemonTower2f from "./pokemon-tower-2f";
import pokemonTower3f from "./pokemon-tower-3f";
import pokemonTower4f from "./pokemon-tower-4f";
import pokemonTower5f from "./pokemon-tower-5f";
import pokemonTower6f from "./pokemon-tower-6f";
import pokemonTower7f from "./pokemon-tower-7f";

// ── Ciudad Celedón ────────────────────────────────────────────────────────────
import celadonCity from "./celadon-city";
import celadonCityPokemonCenter from "./celadon-city-pokemon-center";
import celadonCityPokeMart from "./celadon-city-poke-mart";
import celadonCityGym from "./celadon-city-gym";
import celadonCityDeptStore1f from "./celadon-city-dept-store-1f";
import celadonCityDeptStore2f from "./celadon-city-dept-store-2f";
import celadonCityDeptStore3f from "./celadon-city-dept-store-3f";
import celadonCityDeptStore4f from "./celadon-city-dept-store-4f";
import celadonCityDeptStore5f from "./celadon-city-dept-store-5f";
import celadonCityDeptStore6f from "./celadon-city-dept-store-6f";
import celadonCityGameCorner from "./celadon-city-game-corner";
import celadonCityPrizeRoom from "./celadon-city-prize-room";
import celadonCityHouseA from "./celadon-city-house-a";
import celadonCityHouseB from "./celadon-city-house-b";

// ── Ciudad Fucsia ─────────────────────────────────────────────────────────────
import fuchsiaCity from "./fuchsia-city";
import fuchsiaCityPokemonCenter from "./fuchsia-city-pokemon-center";
import fuchsiaCityPokeMart from "./fuchsia-city-poke-mart";
import fuchsiaCityGym from "./fuchsia-city-gym";
import fuchsiaCityWardenHouse from "./fuchsia-city-warden-house";
import fuchsiaCityHouseA from "./fuchsia-city-house-a";
import fuchsiaCityHouseB from "./fuchsia-city-house-b";
import safariZoneCenter from "./safari-zone-center";
import safariZoneArea1 from "./safari-zone-area-1";
import safariZoneArea2 from "./safari-zone-area-2";
import safariZoneArea3 from "./safari-zone-area-3";

// ── Central Eléctrica ─────────────────────────────────────────────────────────
import powerPlant from "./power-plant";

// ── Islas Espuma ──────────────────────────────────────────────────────────────
import seafoamIslands1f from "./seafoam-islands-1f";
import seafoamIslands2f from "./seafoam-islands-2f";
import seafoamIslands3f from "./seafoam-islands-3f";
import seafoamIslands4f from "./seafoam-islands-4f";

// ── Ciudad Azafrán ────────────────────────────────────────────────────────────
import saffronCity from "./saffron-city";
import saffronCityPokemonCenter from "./saffron-city-pokemon-center";
import saffronCityPokeMart from "./saffron-city-poke-mart";
import saffronCityGym from "./saffron-city-gym";
import saffronCityFightingDojo from "./saffron-city-fighting-dojo";
import saffronCityCopycatHouse from "./saffron-city-copycat-house";
import saffronCityHouseA from "./saffron-city-house-a";
import saffronCityHouseB from "./saffron-city-house-b";
import silphCo1f from "./silph-co-1f";
import silphCo2f from "./silph-co-2f";
import silphCo3f from "./silph-co-3f";
import silphCo4f from "./silph-co-4f";
import silphCo5f from "./silph-co-5f";
import silphCo6f from "./silph-co-6f";
import silphCo7f from "./silph-co-7f";
import silphCo8f from "./silph-co-8f";
import silphCo9f from "./silph-co-9f";
import silphCo10f from "./silph-co-10f";
import silphCo11f from "./silph-co-11f";

// ── Isla Cinabria ─────────────────────────────────────────────────────────────
import cinnabarIsland from "./cinnabar-island";
import cinnabarIslandPokemonCenter from "./cinnabar-island-pokemon-center";
import cinnabarIslandPokeMart from "./cinnabar-island-poke-mart";
import cinnabarIslandGym from "./cinnabar-island-gym";
import cinnabarIslandLab from "./cinnabar-island-lab";
import pokemonMansion1f from "./pokemon-mansion-1f";
import pokemonMansion2f from "./pokemon-mansion-2f";
import pokemonMansion3f from "./pokemon-mansion-3f";
import pokemonMansion4f from "./pokemon-mansion-4f";

// ── Camino Victoria y Liga Pokémon ────────────────────────────────────────────
import victoryRoad1f from "./victory-road-1f";
import victoryRoad2f from "./victory-road-2f";
import victoryRoad3f from "./victory-road-3f";
import indigoPlateau from "./indigo-plateau";
import eliteFour1 from "./elite-four-1";
import eliteFour2 from "./elite-four-2";
import eliteFour3 from "./elite-four-3";
import eliteFour4 from "./elite-four-4";
import championRoom from "./champion-room";

// ── Cueva Celeste ─────────────────────────────────────────────────────────────
import ceruleanCave1f from "./cerulean-cave-1f";
import ceruleanCave2f from "./cerulean-cave-2f";
import ceruleanCave3f from "./cerulean-cave-3f";

const mapData: Record<string, MapType> = {
  // ── Mapas originales ──────────────────────────────────────────────────────
  [MapId.PalletTown]: palletTown,
  [MapId.PalletTownHouseA1F]: houseA1f,
  [MapId.PalletTownHouseA2F]: houseA2f,
  [MapId.PalletTownHouseB]: houseB,
  [MapId.PalletTownLab]: lab,
  [MapId.Route1]: route1,
  [MapId.ViridianCity]: viridianCity,
  [MapId.ViridianCityPokemonCenter]: viridianCityPokemonCenter,
  [MapId.ViridianCityPokeMart]: viridianCityPokeMart,
  [MapId.ViridianCityPokemonAcadamy]: viridianCityAcadamy,
  [MapId.ViridianCityNpcHouse]: viridianCityNpcHouse,
  [MapId.ViridianCityGym]: viridianCityGym,
  [MapId.Route22]: route22,
  [MapId.GateHouse]: gateHouse,
  [MapId.LeagueRoute]: leagueRoute,
  [MapId.Route2]: route2,
  [MapId.Route2Gate]: route2Gate,
  [MapId.ViridianForrest]: viridianForrest,
  [MapId.PewterCity]: pewterCity,
  [MapId.Route2GateNorth]: route2GateNorth,
  [MapId.PewterCityPokeMart]: pewterCityPokeMart,
  [MapId.PewterCityPokemonCenter]: pewterCityPokemonCenter,
  [MapId.PewterCityNpcA]: peweterCityNpcA,
  [MapId.PewterCityNpcB]: peweterCityNpcB,
  [MapId.PewterCityGym]: pewterCityGym,
  [MapId.PewterCityMuseum1f]: pewterMuseum1f,
  [MapId.PewterCityMuseum2f]: pewterMuseum2f,
  [MapId.Route3]: route3,
  [MapId.Route3PokemonCenter]: route3PokemonCenter,
  [MapId.MtMoon1f]: mtMoon1f,
  [MapId.MtMoon2f]: mtMoon2f,
  [MapId.MtMoon3f]: mtMoon3f,

  // ── Rutas nuevas ──────────────────────────────────────────────────────────
  [MapId.Route4]: route4,
  [MapId.Route5]: route5,
  [MapId.Route6]: route6,
  [MapId.Route7]: route7,
  [MapId.Route8]: route8,
  [MapId.Route9]: route9,
  [MapId.Route10]: route10,
  [MapId.Route11]: route11,
  [MapId.Route12]: route12,
  [MapId.Route13]: route13,
  [MapId.Route14]: route14,
  [MapId.Route15]: route15,
  [MapId.Route16]: route16,
  [MapId.Route17]: route17,
  [MapId.Route18]: route18,
  [MapId.Route19]: route19,
  [MapId.Route20]: route20,
  [MapId.Route21]: route21,
  [MapId.Route23]: route23,
  [MapId.Route24]: route24,
  [MapId.Route25]: route25,

  // ── Casetas / caminos subterráneos ────────────────────────────────────────
  [MapId.Route4Gate]: route4Gate,
  [MapId.UndergroundPathNS]: undergroundPathNS,
  [MapId.UndergroundPathEW]: undergroundPathEW,
  [MapId.Route12Gate]: route12Gate,
  [MapId.Route15Gate]: route15Gate,
  [MapId.Route16Gate]: route16Gate,

  // ── Ciudad Celeste ────────────────────────────────────────────────────────
  [MapId.CeruleanCity]: ceruleanCity,
  [MapId.CeruleanCityPokemonCenter]: ceruleanCityPokemonCenter,
  [MapId.CeruleanCityPokeMart]: ceruleanCityPokeMart,
  [MapId.CeruleanCityGym]: ceruleanCityGym,
  [MapId.CeruleanCityBikeShop]: ceruleanCityBikeShop,
  [MapId.CeruleanCityHouseA]: ceruleanCityHouseA,
  [MapId.CeruleanCityHouseB]: ceruleanCityHouseB,

  // ── Ciudad Carmín ─────────────────────────────────────────────────────────
  [MapId.VermilionCity]: vermilionCity,
  [MapId.VermilionCityPokemonCenter]: vermilionCityPokemonCenter,
  [MapId.VermilionCityPokeMart]: vermilionCityPokeMart,
  [MapId.VermilionCityGym]: vermilionCityGym,
  [MapId.VermilionCityFanClub]: vermilionCityFanClub,
  [MapId.VermilionCityHouseA]: vermilionCityHouseA,
  [MapId.VermilionCityHouseB]: vermilionCityHouseB,

  // ── S.S. Aguamarina ───────────────────────────────────────────────────────
  [MapId.SsAnneBf1]: ssAnneBf1,
  [MapId.SsAnne1f]: ssAnne1f,
  [MapId.SsAnne2f]: ssAnne2f,
  [MapId.SsAnne3f]: ssAnne3f,

  // ── Cueva Diglett ─────────────────────────────────────────────────────────
  [MapId.DiglettsCave]: digletsCave,

  // ── Túnel Roca ────────────────────────────────────────────────────────────
  [MapId.RockTunnel1f]: rockTunnel1f,
  [MapId.RockTunnel2f]: rockTunnel2f,

  // ── Pueblo Lavanda ────────────────────────────────────────────────────────
  [MapId.LavenderTown]: lavenderTown,
  [MapId.LavenderTownPokemonCenter]: lavenderTownPokemonCenter,
  [MapId.LavenderTownPokeMart]: lavenderTownPokeMart,
  [MapId.LavenderTownHouseA]: lavenderTownHouseA,
  [MapId.LavenderTownHouseB]: lavenderTownHouseB,

  // ── Torre Pokémon ─────────────────────────────────────────────────────────
  [MapId.PokemonTower1f]: pokemonTower1f,
  [MapId.PokemonTower2f]: pokemonTower2f,
  [MapId.PokemonTower3f]: pokemonTower3f,
  [MapId.PokemonTower4f]: pokemonTower4f,
  [MapId.PokemonTower5f]: pokemonTower5f,
  [MapId.PokemonTower6f]: pokemonTower6f,
  [MapId.PokemonTower7f]: pokemonTower7f,

  // ── Ciudad Celedón ────────────────────────────────────────────────────────
  [MapId.CeladonCity]: celadonCity,
  [MapId.CeladonCityPokemonCenter]: celadonCityPokemonCenter,
  [MapId.CeladonCityPokeMart]: celadonCityPokeMart,
  [MapId.CeladonCityGym]: celadonCityGym,
  [MapId.CeladonCityDeptStore1f]: celadonCityDeptStore1f,
  [MapId.CeladonCityDeptStore2f]: celadonCityDeptStore2f,
  [MapId.CeladonCityDeptStore3f]: celadonCityDeptStore3f,
  [MapId.CeladonCityDeptStore4f]: celadonCityDeptStore4f,
  [MapId.CeladonCityDeptStore5f]: celadonCityDeptStore5f,
  [MapId.CeladonCityDeptStore6f]: celadonCityDeptStore6f,
  [MapId.CeladonCityGameCorner]: celadonCityGameCorner,
  [MapId.CeladonCityPrizeRoom]: celadonCityPrizeRoom,
  [MapId.CeladonCityHouseA]: celadonCityHouseA,
  [MapId.CeladonCityHouseB]: celadonCityHouseB,

  // ── Ciudad Fucsia ─────────────────────────────────────────────────────────
  [MapId.FuchsiaCity]: fuchsiaCity,
  [MapId.FuchsiaCityPokemonCenter]: fuchsiaCityPokemonCenter,
  [MapId.FuchsiaCityPokeMart]: fuchsiaCityPokeMart,
  [MapId.FuchsiaCityGym]: fuchsiaCityGym,
  [MapId.FuchsiaCityWardenHouse]: fuchsiaCityWardenHouse,
  [MapId.FuchsiaCityHouseA]: fuchsiaCityHouseA,
  [MapId.FuchsiaCityHouseB]: fuchsiaCityHouseB,
  [MapId.SafariZoneCenter]: safariZoneCenter,
  [MapId.SafariZoneArea1]: safariZoneArea1,
  [MapId.SafariZoneArea2]: safariZoneArea2,
  [MapId.SafariZoneArea3]: safariZoneArea3,

  // ── Central Eléctrica ─────────────────────────────────────────────────────
  [MapId.PowerPlant]: powerPlant,

  // ── Islas Espuma ──────────────────────────────────────────────────────────
  [MapId.SeafoamIslands1f]: seafoamIslands1f,
  [MapId.SeafoamIslands2f]: seafoamIslands2f,
  [MapId.SeafoamIslands3f]: seafoamIslands3f,
  [MapId.SeafoamIslands4f]: seafoamIslands4f,

  // ── Ciudad Azafrán ────────────────────────────────────────────────────────
  [MapId.SaffronCity]: saffronCity,
  [MapId.SaffronCityPokemonCenter]: saffronCityPokemonCenter,
  [MapId.SaffronCityPokeMart]: saffronCityPokeMart,
  [MapId.SaffronCityGym]: saffronCityGym,
  [MapId.SaffronCityFightingDojo]: saffronCityFightingDojo,
  [MapId.SaffronCityCopycatHouse]: saffronCityCopycatHouse,
  [MapId.SaffronCityHouseA]: saffronCityHouseA,
  [MapId.SaffronCityHouseB]: saffronCityHouseB,
  [MapId.SilphCo1f]: silphCo1f,
  [MapId.SilphCo2f]: silphCo2f,
  [MapId.SilphCo3f]: silphCo3f,
  [MapId.SilphCo4f]: silphCo4f,
  [MapId.SilphCo5f]: silphCo5f,
  [MapId.SilphCo6f]: silphCo6f,
  [MapId.SilphCo7f]: silphCo7f,
  [MapId.SilphCo8f]: silphCo8f,
  [MapId.SilphCo9f]: silphCo9f,
  [MapId.SilphCo10f]: silphCo10f,
  [MapId.SilphCo11f]: silphCo11f,

  // ── Isla Cinabria ─────────────────────────────────────────────────────────
  [MapId.CinnabarIsland]: cinnabarIsland,
  [MapId.CinnabarIslandPokemonCenter]: cinnabarIslandPokemonCenter,
  [MapId.CinnabarIslandPokeMart]: cinnabarIslandPokeMart,
  [MapId.CinnabarIslandGym]: cinnabarIslandGym,
  [MapId.CinnabarIslandLab]: cinnabarIslandLab,
  [MapId.PokemonMansion1f]: pokemonMansion1f,
  [MapId.PokemonMansion2f]: pokemonMansion2f,
  [MapId.PokemonMansion3f]: pokemonMansion3f,
  [MapId.PokemonMansion4f]: pokemonMansion4f,

  // ── Camino Victoria y Liga Pokémon ────────────────────────────────────────
  [MapId.VictoryRoad1f]: victoryRoad1f,
  [MapId.VictoryRoad2f]: victoryRoad2f,
  [MapId.VictoryRoad3f]: victoryRoad3f,
  [MapId.IndigoPlateau]: indigoPlateau,
  [MapId.EliteFour1]: eliteFour1,
  [MapId.EliteFour2]: eliteFour2,
  [MapId.EliteFour3]: eliteFour3,
  [MapId.EliteFour4]: eliteFour4,
  [MapId.ChampionRoom]: championRoom,

  // ── Cueva Celeste ─────────────────────────────────────────────────────────
  [MapId.CeruleanCave1f]: ceruleanCave1f,
  [MapId.CeruleanCave2f]: ceruleanCave2f,
  [MapId.CeruleanCave3f]: ceruleanCave3f,
};

export default mapData;
