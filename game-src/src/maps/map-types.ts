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
  hideCondition?: "has-pokemon";
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
  exitReturnMap?: MapId;
  exitReturnPos?: PosType;
  music?: string;
  encounters?: EncountersType;
  grass: Record<number, number[]>;
  recoverLocation?: PosType;
  fences?: Record<number, number[]>;
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
  /** Posición del NPC de batallas online en este mapa (centros Pokémon) */
  onlineBattleNpc?: PosType;
  /**
   * Si está en `true`, el jugador puede usar la Bicicleta en este mapa.
   * Por defecto los mapas son interiores (sin bici). Al entrar en un mapa
   * sin `allowBicycle`, se desmonta automáticamente.
   */
  allowBicycle?: boolean;
}
