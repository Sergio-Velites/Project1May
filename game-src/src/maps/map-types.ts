import { NpcType } from "../app/npcs";
import { ItemType } from "../app/use-item-data";
import { Direction, PosType } from "../state/state-types";

export enum MapId {
  PalletTown = "pallet-town",
  PalletTownHouseA1F = "pallet-town-house-a-1f",
  PalletTownHouseA2F = "pallet-town-house-a-2f",
  PalletTownHouseB = "pallet-town-house-b",
  Route1 = "route-1",
  PalletTownLab = "pallet-town-lab",
  ViridianCity = "viridian-city",
  ViridianCityGym = "viridian-city-gym",
  ViridianCityPokeMart = "viridian-city-poke-mart",
  ViridianCityPokemonCenter = "viridian-city-pokemon-center",
  ViridianCityPokemonAcadamy = "viridian-city-pokemon-acadamy",
  ViridianCityNpcHouse = "viridian-city-npc-house",
  Route22 = "route-22",
  GateHouse = "gate-house",
  LeagueRoute = "league-route",
  Route2 = "route-2",
  Route2Gate = "route-2-gate",
  ViridianForrest = "viridian-forrest",
  Route2GateNorth = "route-2-gate-north",
  PewterCity = "pewter-city",
  PewterCityPokeMart = "pewter-city-poke-mart",
  PewterCityPokemonCenter = "pewter-city-pokemon-center",
  PewterCityNpcA = "pewter-city-npc-a",
  PewterCityNpcB = "pewter-city-npc-b",
  PewterCityGym = "pewter-city-gym",
  PewterCityMuseum1f = "pewter-city-museum-1f",
  PewterCityMuseum2f = "pewter-city-museum-2f",
  Route3 = "route-3",
  Route3PokemonCenter = "route-3-pokemon-center",
  MtMoon1f = "mt-moon-1f",
  MtMoon2f = "mt-moon-2f",
  MtMoon3f = "mt-moon-3f",

  // ── Rutas nuevas ──────────────────────────────────────────────────────────
  Route4 = "route-4",
  Route5 = "route-5",
  Route6 = "route-6",
  Route7 = "route-7",
  Route8 = "route-8",
  Route9 = "route-9",
  Route10 = "route-10",
  Route11 = "route-11",
  Route12 = "route-12",
  Route13 = "route-13",
  Route14 = "route-14",
  Route15 = "route-15",
  Route16 = "route-16",
  Route17 = "route-17",
  Route18 = "route-18",
  Route19 = "route-19",
  Route20 = "route-20",
  Route21 = "route-21",
  Route23 = "route-23",
  Route24 = "route-24",
  Route25 = "route-25",

  // ── Casetas / caminos subterráneos ────────────────────────────────────────
  Route4Gate = "route-4-gate",
  UndergroundPathNS = "underground-path-ns",
  UndergroundPathEW = "underground-path-ew",
  Route12Gate = "route-12-gate",
  Route15Gate = "route-15-gate",
  Route16Gate = "route-16-gate",

  // ── Ciudad Celeste ────────────────────────────────────────────────────────
  CeruleanCity = "cerulean-city",
  CeruleanCityPokemonCenter = "cerulean-city-pokemon-center",
  CeruleanCityPokeMart = "cerulean-city-poke-mart",
  CeruleanCityGym = "cerulean-city-gym",
  CeruleanCityBikeShop = "cerulean-city-bike-shop",
  CeruleanCityHouseA = "cerulean-city-house-a",
  CeruleanCityHouseB = "cerulean-city-house-b",

  // ── Ciudad Carmín ─────────────────────────────────────────────────────────
  VermilionCity = "vermilion-city",
  VermilionCityPokemonCenter = "vermilion-city-pokemon-center",
  VermilionCityPokeMart = "vermilion-city-poke-mart",
  VermilionCityGym = "vermilion-city-gym",
  VermilionCityFanClub = "vermilion-city-fan-club",
  VermilionCityHouseA = "vermilion-city-house-a",
  VermilionCityHouseB = "vermilion-city-house-b",

  // ── S.S. Aguamarina ───────────────────────────────────────────────────────
  SsAnneBf1 = "ss-anne-bf1",
  SsAnne1f = "ss-anne-1f",
  SsAnne2f = "ss-anne-2f",
  SsAnne3f = "ss-anne-3f",

  // ── Cueva Diglett ─────────────────────────────────────────────────────────
  DiglettsCave = "diglets-cave",

  // ── Túnel Roca ────────────────────────────────────────────────────────────
  RockTunnel1f = "rock-tunnel-1f",
  RockTunnel2f = "rock-tunnel-2f",

  // ── Pueblo Lavanda ────────────────────────────────────────────────────────
  LavenderTown = "lavender-town",
  LavenderTownPokemonCenter = "lavender-town-pokemon-center",
  LavenderTownPokeMart = "lavender-town-poke-mart",
  LavenderTownHouseA = "lavender-town-house-a",
  LavenderTownHouseB = "lavender-town-house-b",

  // ── Torre Pokémon ─────────────────────────────────────────────────────────
  PokemonTower1f = "pokemon-tower-1f",
  PokemonTower2f = "pokemon-tower-2f",
  PokemonTower3f = "pokemon-tower-3f",
  PokemonTower4f = "pokemon-tower-4f",
  PokemonTower5f = "pokemon-tower-5f",
  PokemonTower6f = "pokemon-tower-6f",
  PokemonTower7f = "pokemon-tower-7f",

  // ── Ciudad Celedón ────────────────────────────────────────────────────────
  CeladonCity = "celadon-city",
  CeladonCityPokemonCenter = "celadon-city-pokemon-center",
  CeladonCityPokeMart = "celadon-city-poke-mart",
  CeladonCityGym = "celadon-city-gym",
  CeladonCityDeptStore1f = "celadon-city-dept-store-1f",
  CeladonCityDeptStore2f = "celadon-city-dept-store-2f",
  CeladonCityDeptStore3f = "celadon-city-dept-store-3f",
  CeladonCityDeptStore4f = "celadon-city-dept-store-4f",
  CeladonCityDeptStore5f = "celadon-city-dept-store-5f",
  CeladonCityDeptStore6f = "celadon-city-dept-store-6f",
  CeladonCityGameCorner = "celadon-city-game-corner",
  CeladonCityPrizeRoom = "celadon-city-prize-room",
  CeladonCityHouseA = "celadon-city-house-a",
  CeladonCityHouseB = "celadon-city-house-b",

  // ── Ciudad Fucsia ─────────────────────────────────────────────────────────
  FuchsiaCity = "fuchsia-city",
  FuchsiaCityPokemonCenter = "fuchsia-city-pokemon-center",
  FuchsiaCityPokeMart = "fuchsia-city-poke-mart",
  FuchsiaCityGym = "fuchsia-city-gym",
  FuchsiaCityWardenHouse = "fuchsia-city-warden-house",
  FuchsiaCityHouseA = "fuchsia-city-house-a",
  FuchsiaCityHouseB = "fuchsia-city-house-b",
  SafariZoneCenter = "safari-zone-center",
  SafariZoneArea1 = "safari-zone-area-1",
  SafariZoneArea2 = "safari-zone-area-2",
  SafariZoneArea3 = "safari-zone-area-3",

  // ── Central Eléctrica ─────────────────────────────────────────────────────
  PowerPlant = "power-plant",

  // ── Islas Espuma ──────────────────────────────────────────────────────────
  SeafoamIslands1f = "seafoam-islands-1f",
  SeafoamIslands2f = "seafoam-islands-2f",
  SeafoamIslands3f = "seafoam-islands-3f",
  SeafoamIslands4f = "seafoam-islands-4f",

  // ── Ciudad Azafrán ────────────────────────────────────────────────────────
  SaffronCity = "saffron-city",
  SaffronCityPokemonCenter = "saffron-city-pokemon-center",
  SaffronCityPokeMart = "saffron-city-poke-mart",
  SaffronCityGym = "saffron-city-gym",
  SaffronCityFightingDojo = "saffron-city-fighting-dojo",
  SaffronCityCopycatHouse = "saffron-city-copycat-house",
  SaffronCityHouseA = "saffron-city-house-a",
  SaffronCityHouseB = "saffron-city-house-b",
  SilphCo1f = "silph-co-1f",
  SilphCo2f = "silph-co-2f",
  SilphCo3f = "silph-co-3f",
  SilphCo4f = "silph-co-4f",
  SilphCo5f = "silph-co-5f",
  SilphCo6f = "silph-co-6f",
  SilphCo7f = "silph-co-7f",
  SilphCo8f = "silph-co-8f",
  SilphCo9f = "silph-co-9f",
  SilphCo10f = "silph-co-10f",
  SilphCo11f = "silph-co-11f",

  // ── Isla Cinabria ─────────────────────────────────────────────────────────
  CinnabarIsland = "cinnabar-island",
  CinnabarIslandPokemonCenter = "cinnabar-island-pokemon-center",
  CinnabarIslandPokeMart = "cinnabar-island-poke-mart",
  CinnabarIslandGym = "cinnabar-island-gym",
  CinnabarIslandLab = "cinnabar-island-lab",
  PokemonMansion1f = "pokemon-mansion-1f",
  PokemonMansion2f = "pokemon-mansion-2f",
  PokemonMansion3f = "pokemon-mansion-3f",
  PokemonMansion4f = "pokemon-mansion-4f",

  // ── Camino Victoria y Liga Pokémon ────────────────────────────────────────
  VictoryRoad1f = "victory-road-1f",
  VictoryRoad2f = "victory-road-2f",
  VictoryRoad3f = "victory-road-3f",
  IndigoPlateau = "indigo-plateau",
  IndigoPlateauLobby = "indigo-plateau-lobby",
  EliteFour1 = "elite-four-1",
  EliteFour2 = "elite-four-2",
  EliteFour3 = "elite-four-3",
  EliteFour4 = "elite-four-4",
  ChampionRoom = "champion-room",

  // ── Cueva Celeste ─────────────────────────────────────────────────────────
  CeruleanCave1f = "cerulean-cave-1f",
  CeruleanCave2f = "cerulean-cave-2f",
  CeruleanCave3f = "cerulean-cave-3f",

  // ── Interiores añadidos (auditoría de puertas jul 2026) ──────────────────
  Route5DayCare = "route-5-day-care",
  Route5Gate = "route-5-gate",
  Route6Gate = "route-6-gate",
  Route5UndergroundEntrance = "route-5-underground-entrance",
  Route6UndergroundEntrance = "route-6-underground-entrance",
  Route7UndergroundEntrance = "route-7-underground-entrance",
  Route8UndergroundEntrance = "route-8-underground-entrance",
  Route10PokemonCenter = "route-10-pokemon-center",
  Route12FisherHouse = "route-12-fisher-house",
  Route16FlyHouse = "route-16-fly-house",
  Route25BillsHouse = "route-25-bills-house",
  LavenderTownHouseC = "lavender-town-house-c",
  VermilionCityOldRodHouse = "vermilion-city-old-rod-house",
  FuchsiaCityGoodRodHouse = "fuchsia-city-good-rod-house",
  CeladonCityHouseC = "celadon-city-house-c",
  CeladonCityMansion1f = "celadon-city-mansion-1f",
  CeladonCityMansion2f = "celadon-city-mansion-2f",
  CeladonCityMansion3f = "celadon-city-mansion-3f",
  CeladonCityMansionRoofHouse = "celadon-city-mansion-roof-house",
  SafariZoneCenterRestHouse = "safari-zone-center-rest-house",
  SafariZoneArea1RestHouse = "safari-zone-area-1-rest-house",
  SafariZoneArea2RestHouse = "safari-zone-area-2-rest-house",
  SafariZoneArea3RestHouse = "safari-zone-area-3-rest-house",
  SafariZoneArea3RestHouseB = "safari-zone-area-3-rest-house-b",
  CeruleanCityHouseC = "cerulean-city-house-c",
  Route2TradeHouse = "route-2-trade-house",

  // ── S.S. Anne: salas interiores + cubierta ────────────────────────────────
  SsAnneCabin1fA = "ss-anne-cabin-1f-a",
  SsAnneCabin1fB = "ss-anne-cabin-1f-b",
  SsAnneCabin1fC = "ss-anne-cabin-1f-c",
  SsAnneCabin1fD = "ss-anne-cabin-1f-d",
  SsAnneCabin1fE = "ss-anne-cabin-1f-e",
  SsAnneCabin2fA = "ss-anne-cabin-2f-a",
  SsAnneCabin2fB = "ss-anne-cabin-2f-b",
  SsAnneCabin2fC = "ss-anne-cabin-2f-c",
  SsAnneCabin2fD = "ss-anne-cabin-2f-d",
  SsAnneCabin2fE = "ss-anne-cabin-2f-e",
  SsAnneCabin2fF = "ss-anne-cabin-2f-f",
  SsAnneCabinB1fA = "ss-anne-cabin-b1f-a",
  SsAnneCabinB1fB = "ss-anne-cabin-b1f-b",
  SsAnneCabinB1fC = "ss-anne-cabin-b1f-c",
  SsAnneCabinB1fD = "ss-anne-cabin-b1f-d",
  SsAnneCabinB1fE = "ss-anne-cabin-b1f-e",
  SsAnneKitchen = "ss-anne-kitchen",
  SsAnneCaptain = "ss-anne-captain",
  SsAnneDeck = "ss-anne-deck",
}

export interface PokemonMinimalType {
  id: number;
  level: number;
}

export interface PokemonEncounterData {
  id: number;
  chance: number;
  conditionValues: { name: string; url: string }[];
  maxLevel: number;
  minLevel: number;
  /**
   * Tramos horarios (Gen II) en los que este Pokémon puede aparecer.
   * - undefined o [] → disponible las 24 h (por defecto: no rompe nada).
   * - subconjunto de ["morning","day","night"] → solo en esos tramos.
   * Ver `app/time-helper.ts` para los rangos de hora exactos.
   */
  timesOfDay?: ("morning" | "day" | "night")[];
}

export interface EncounterData {
  rate: number;
  pokemon: PokemonEncounterData[];
}

export interface EncountersType {
  walk: EncounterData;
  surf: EncounterData;
  oldRod: EncounterData;
  goodRod: EncounterData;
  superRod: EncounterData;
  rockSmash: EncounterData;
  headbutt: EncounterData;
  darkGrass: EncounterData;
  grassSpots: EncounterData;
  caveSpots: EncounterData;
  bridgeSpots: EncounterData;
  superRodSpots: EncounterData;
  surfSpots: EncounterData;
  yellowFlowers: EncounterData;
  purpleFlowers: EncounterData;
  redFlowers: EncounterData;
  roughTerrain: EncounterData;
  gift: EncounterData;
  giftEgg: EncounterData;
  onlyOne: EncounterData;
}

export interface TrainerType {
  npc: NpcType;
  pokemon: PokemonMinimalType[];
  facing: Direction;
  intro: string[];
  outtro: string[];
  money: number;
  pos: PosType;
  /**
   * Distancia (en tiles) a la que el entrenador detecta al jugador y
   * fuerza el combate. Si se omite, se usa el valor global TRAINER_VISION (5).
   * 0 = nunca dispara combate por proximidad — solo combate al hablar (A).
   */
  sightRange?: number;
  persistent?: boolean;
  /** "has-pokemon": se oculta cuando el jugador tiene ≥1 pokémon.
   *  "trainer-defeated:<trainerId>": se oculta cuando ese trainer está en defeatedTrainers. */
  hideCondition?: "has-pokemon" | `trainer-defeated:${string}`;
  isOnline?: boolean;
  /** Para batallas online: nombre real del invitado. Se muestra en lugar de "rival" durante el combate. */
  playerName?: string;
  /** Indica que este entrenador es líder de gimnasio → música de batalla y victoria de Gym Leader. */
  isGymLeader?: boolean;
  postGame?: {
    message: string[];
    items?: ItemType[];
  };
}

export interface MapItemType {
  pos: PosType;
  item: ItemType;
  hidden?: boolean;
}

/**
 * Recompensa opcional asociada a un tile de texto (map.textRewards[y][x]).
 * Cuando el jugador lee el texto completo se le ofrece el premio.
 * Una vez aceptado, `questId` se añade a `completedQuests` y el texto
 * queda bloqueado permanentemente.
 */
export interface TextReward {
  type: "pokemon" | "item";
  /** Solo si type === "pokemon" */
  pokemonId?: number;
  level?: number;
  /** Solo si type === "item" */
  itemKey?: ItemType;
  amount?: number;
  /** ID único de quest. Se recomienda el formato: "text-reward-<mapId>-<x>-<y>" */
  questId: string;
}

/**
 * Pokéball-regalo declarativa colocada desde el editor de mapas.
 * Al pulsar A en su posición, el jugador recibe el pokémon (si tiene hueco)
 * y la pokéball desaparece persistiendo el estado vía `completeQuest(questId)`.
 */
export interface SimpleGiftType {
  pokemonId: number;
  level: number;
  pos: PosType;
  /** Identificador único de quest. Si está en completedQuests, no se renderiza. */
  questId: string;
}

/**
 * Árbol cortable (HM Corte / Tijera). Bloquea el paso hasta que un Pokémon
 * del equipo que sepa "cut" lo corte. El estado persiste vía completedQuests.
 */
export interface CuttableTreeType {
  pos: PosType;
  /** Formato recomendado: "cut-tree-<mapId>-<x>-<y>" */
  questId: string;
}

/**
 * Árbol de bayas (Gen II). Bloquea el paso como un muro. Da UNA baya al día:
 * al pulsar A de frente se recoge `item`; el árbol rebrota a medianoche
 * (hora local del dispositivo), igual que en Oro/Plata/Cristal.
 * El estado de recogida persiste en el save (`berryTreesPicked`,
 * clave `"<mapId>-<x>-<y>"` → fecha local de la última recogida).
 */
export interface BerryTreeType {
  pos: PosType;
  /** Baya (u objeto) que da el árbol cada día. */
  item: ItemType;
}

/**
 * Roca empujable con la MO Fuerza (HM04 / "strength"), estilo Gen I.
 * Bloquea el paso como un muro hasta que el jugador activa FUERZA (pulsando A
 * frente a la roca con un Pokémon del equipo que conozca el movimiento
 * "strength"). Una vez activada, el jugador puede empujar la roca un tile en
 * la dirección de avance, siempre que el tile de destino esté libre.
 *
 * Fiel al original: la posición de las rocas NO se persiste — al salir y volver
 * a entrar al mapa las rocas vuelven a su posición inicial (`pos`).
 */
export interface BoulderType {
  /** Posición inicial de la roca (a la que vuelve al recargar el mapa). */
  pos: PosType;
  /** Identificador único y estable de la roca dentro del mapa.
   *  Formato recomendado: "boulder-<mapId>-<x>-<y>". */
  id: string;
}

/**
 * Pokémon estático en el mapa (estilo legendarios Gen I: Articuno, Snorlax…).
 * Aparece visualmente como un sprite en world-coords. Al pulsar A frente a él
 * se inicia un combate salvaje. Una vez derrotado o capturado desaparece.
 * El estado persiste via `completedQuests` (questId).
 */
export type StaticPokemonSprite =
  | "bird-a"  | "bird-b"
  | "bug-a"   | "bug-b"
  | "cute-a"  | "cute-b"
  | "dog-a"   | "dog-b"
  | "dragon-a"| "dragon-b"
  | "fish-a"  | "fish-b"
  | "fossil-a"| "fossil-b"
  | "grass-a" | "grass-b"
  | "monster-a"| "monster-b"
  | "ball-0"   | "ball-a"   | "ball-b"
  | "none";

export interface StaticPokemonType {
  pokemonId: number;
  level: number;
  pos: PosType;
  /** Sprite decorativo en el mapa. "none" = invisible (solo bloquea el tile). */
  sprite: StaticPokemonSprite;
  /** Se añade a completedQuests al derrotarlo o capturarlo. */
  questId: string;
  /** Texto que aparece antes de iniciar el combate (opcional). */
  intro?: string[];
}

export interface MapWithPos {
  map: MapId;
  pos: PosType;
}

export interface MapType {
  name: string;
  image: string;
  height: number;
  width: number;
  start: PosType;
  walls: Record<number, number[]>;
  text: Record<number, Record<number, string[]>>;
  /** Recompensas opcionales ligadas a tiles de texto. Mismo sistema de coordenadas que `text`. */
  textRewards?: Record<number, Record<number, TextReward>>;
  maps: Record<number, Record<number, MapId>>;
  teleports?: Record<number, Record<number, MapWithPos>>;
  exits: Record<number, number[]>;
  cave?: boolean;
  /**
   * Mapa oscuro (cuevas tipo Túnel Roca, Gen I): sin la MO Destello activa solo
   * se ve un pequeño radio alrededor del jugador. Al usar DESTELLO (Pokémon que
   * conozca "flash") el mapa se ilumina por completo. Fiel al original, la luz
   * se mantiene al pasar de un mapa `dark` a otro `dark`, y se apaga al salir a
   * un mapa no-oscuro. Por defecto (undefined) el mapa NO es oscuro.
   */
  dark?: boolean;
  exitReturnMap?: MapId;
  exitReturnPos?: PosType;
  music?: string;
  encounters?: EncountersType;
  grass: Record<number, number[]>;
  recoverLocation?: PosType;
  fences?: Record<number, number[]>;
  /**
   * Dirección de salto de cada saliente (ledge). Mismo formato
   * `{ fila: { col: Direction } }` que `spinners`. La dirección indica hacia
   * dónde se PUEDE saltar el saliente (y, por tanto, desde qué lado es un muro).
   *
   * Compatibilidad: si un tile presente en `fences` NO aparece aquí, su
   * dirección por defecto es `Direction.Down` (todos los salientes anteriores
   * a este sistema saltan hacia abajo, como en Pokémon Rojo/Azul). Por eso no
   * es necesario migrar ningún mapa existente.
   */
  fenceDirections?: Record<number, Record<number, Direction>>;
  /**
   * Elevación por tile (planos de altura estilo Pokémon: meseta marrón vs
   * suelo verde). Formato sparse `{ fila: { col: nivel } }`; los tiles
   * ausentes están a nivel 0. Solo se puede caminar entre tiles del MISMO
   * nivel; el cambio de plano se hace por `ramps` (escaleras/rampas) o
   * saltando un saliente. El "plano actual" del jugador es la elevación del
   * tile que pisa — al teletransportarse o cambiar de mapa el plano es el del
   * tile de llegada, sin ningún estado adicional que resetear.
   */
  elevations?: Record<number, Record<number, number>>;
  /**
   * Rampas/escaleras: tiles transitables desde y hacia CUALQUIER nivel
   * (conectan los planos de `elevations`). Mismo formato `{ fila: [cols] }`
   * que `walls`.
   */
  ramps?: Record<number, number[]>;
  /**
   * Tiles de agua. Mismo formato Record<row, col[]> que walls/grass.
   * Bloquean el paso (como muros) pero permiten pescar desde tile adyacente
   * con cualquiera de las 3 cañas (`OldRod`, `GoodRod`, `SuperRod`).
   */
  water?: Record<number, number[]>;
  pokemonCenter?: PosType;
  pc?: PosType;
  store?: PosType;
  storeItems?: ItemType[];
  spinners?: Record<number, Record<number, Direction>>;
  stoppers?: Record<number, number[]>;
  trainers?: TrainerType[];
  items?: MapItemType[];
  /** Pokéballs-regalo declarativas (editables desde el editor de mapas). */
  gifts?: SimpleGiftType[];
  /** Pokémon estáticos en el mapa (estilo legendarios). */
  staticPokemon?: StaticPokemonType[];
  /** Árboles cortables con la MO Corte. Bloquean el paso hasta ser cortados. */
  cuttableTrees?: CuttableTreeType[];
  /** Árboles de bayas (Gen II): una baya al día, rebrotan a medianoche. */
  berryTrees?: BerryTreeType[];
  /** Rocas empujables con la MO Fuerza (strength). Bloquean el paso. */
  boulders?: BoulderType[];
  /** Posición del NPC de batallas online en este mapa (centros Pokémon) */
  onlineBattleNpc?: PosType;
  /** Posición del NPC de la guardería (Goñi): regala un Pokémon bebé al día. */
  dayCareNpc?: PosType;
  /**
   * Si está en `true`, el jugador puede usar la Bicicleta en este mapa.
   * Por defecto los mapas son interiores (sin bici). Al entrar en un mapa
   * sin `allowBicycle`, se desmonta automáticamente.
   */
  allowBicycle?: boolean;
  /** Posición de este mapa en el minimapa de Kanto (píxeles sobre kanto_region.png 237×213). */
  minimapPos?: PosType;
  /**
   * Agrupación en el minimapa del Map Editor (metadato editor-only; el juego no
   * lo consume). `undefined` = agrupar automáticamente por nombre; `""` = mapa
   * suelto (excluido de cualquier grupo); `"<mapId>"` = forzar a ese grupo.
   */
  minimapParent?: string;
  /**
   * Destino válido para la MO Vuelo (Gen I). Para que el jugador pueda volar
   * aquí deben cumplirse TRES condiciones de configuración: `flyable === true`,
   * tener `minimapPos` (punto en el mapa de Kanto) y `flySpot` (casilla de
   * aterrizaje). Además, para que el destino esté DISPONIBLE en la partida:
   *   - `flyAlwaysAvailable === true` → disponible desde el principio, o
   *   - el jugador ha pisado alguna casilla de `flyUnlockTiles` (queda
   *     registrado en `unlockedFlyMaps` del save).
   * Se configura desde el Map Editor.
   */
  flyable?: boolean;
  /** Casilla (coordenadas de tile) donde aterriza el jugador al volar a este mapa. */
  flySpot?: PosType;
  /**
   * Si es `true`, este destino de Vuelo está disponible desde el principio, sin
   * que el jugador tenga que pisar ninguna casilla (para sitios accesibles ya
   * desde el inicio). Por defecto `false`. Editor-only checkbox.
   */
  flyAlwaysAvailable?: boolean;
  /**
   * Casillas (formato `{fila: [cols]}`, igual que `walls`) que, al pisarlas,
   * DESBLOQUEAN este mapa como destino de Vuelo (se añade a `unlockedFlyMaps`
   * del save al pisarlas y se persiste al guardar). Normalmente se colocan en
   * la entrada del sitio. Irrelevante si `flyAlwaysAvailable === true`.
   */
  flyUnlockTiles?: Record<number, number[]>;
}
