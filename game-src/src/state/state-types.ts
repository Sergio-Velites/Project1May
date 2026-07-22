import { ItemType } from "../app/use-item-data";
import { MapId, TrainerType } from "../maps/map-types";

export interface InventoryItemType {
  item: ItemType;
  amount: number;
}

export enum Direction {
  Down = "down",
  Up = "up",
  Left = "left",
  Right = "right",
}

export interface PosType {
  x: number;
  y: number;
}

export interface MoveState {
  id: string;
  pp: number;
}

/**
 * Estados de combate persistentes (Gen I).
 *
 * En Pokémon Rojo/Azul los siguientes estados se mantienen pegados al
 * Pokémon individual y persisten entre combates. Solo se eliminan en un
 * Centro Pokémon o consumiendo el ítem correspondiente
 * (Antídoto, Antihielo, Despertar, Antiparalizante, Antiquemar, Cura Total).
 *
 * No es un atributo del equipo: cada Pokémon tiene su propio estado.
 */
export type StatusType =
  | "poison"
  | "badly-poisoned"
  | "burn"
  | "paralysis"
  | "sleep"
  | "freeze";

export interface BattleStatus {
  type: StatusType;
  /** Contador interno: turnos restantes de sueño / contador de tóxico, etc. */
  turns: number;
}

export interface PokemonInstance {
  id: number;
  level: number;
  xp: number;
  hp: number;
  moves: MoveState[];
  /** Estado persistente entre combates (poison, burn, paralysis, sleep, freeze). */
  status?: BattleStatus | null;
  /**
   * Amistad / felicidad (Gen II, 0–255). Sube al subir de nivel y al caminar;
   * a partir de 220 dispara las evoluciones por amistad (Crobat, Blissey,
   * Espeon/Umbreon, etc.). Indefinido en saves antiguos → se trata como base 70.
   */
  friendship?: number;
  /**
   * Género (Gen II): "male" | "female" | null (sin género, p.ej. Magnemite).
   * Se sortea una vez al crear el Pokémon según el ratio oficial de la especie.
   * Indefinido en saves antiguos → se asigna al cargar (migración perezosa).
   */
  gender?: "male" | "female" | null;
  /**
   * Objeto equipado (Gen II). Se da/quita desde la mochila o el menú Pokémon.
   * Sus efectos (Restos, objetos de tipo ×1.1, bayas autoconsumibles, etc.)
   * se aplican en combate. null/undefined = sin objeto.
   */
  heldItem?: ItemType | null;
}

export interface PokemonEncounterType {
  id: number;
  level: number;
  hp: number;
  moves: string[];
  /** Género del Pokémon salvaje/rival (Gen II). Se sortea al crear el
   *  encuentro y, si se captura, se conserva en el PokemonInstance. */
  gender?: "male" | "female" | null;
  /** ¿El encuentro empezó pescando? Lo usa la Cebo Ball (Lure Ball, ×3). */
  fromFishing?: boolean;
  /** Si el encuentro es un Pokémon estático del mapa, questId a completar al acabar. */
  staticQuestId?: string;
}

export interface GameState {
  pos: PosType;
  jumping: boolean;
  moving: boolean;
  direction: Direction;
  map: MapId;
  inventory: InventoryItemType[];
  name: string;
  pokemon: PokemonInstance[];
  pc: PokemonInstance[];
  activePokemonIndex: number;
  trainerEncounter?: TrainerType;
  pokemonEncounter?: PokemonEncounterType;
  money: number;
  defeatedTrainers: string[];
  collectedItems: string[];
  completedQuests: string[];
  /** Árboles cortados en la sesión actual (se reinicia al cambiar de mapa). No se persiste en saves. */
  sessionCutTrees?: string[];
  /** Posición actual de cada roca empujable (MO Fuerza), por `id`. Estado de
   *  sesión: se reinicia al cambiar de mapa (las rocas vuelven a su sitio). */
  boulderPositions?: Record<string, PosType>;
  /** ¿La MO Fuerza está activada en el mapa actual? Se activa pulsando A frente
   *  a una roca con un Pokémon que sepa "strength". Se reinicia al cambiar de mapa. */
  strengthActive?: boolean;
  /** ¿La MO Destello está activa? Ilumina los mapas oscuros (`dark`). Se activa
   *  desde el menú Pokémon con un Pokémon que sepa "flash". Fiel al original:
   *  persiste al pasar entre mapas `dark` y se apaga al entrar en uno no-oscuro.
   *  Se reinicia al cargar partida. */
  flashActive?: boolean;
  seenPokemon: number[];    // IDs vistos en la Pokédex
  caughtPokemon: number[]; // IDs capturados
  npcFacings: Record<string, Direction>;
  /** ¿El jugador está actualmente en bicicleta? Persistido. */
  onBicycle?: boolean;
  /** ¿El jugador está actualmente surfeando? Persistido. */
  onSurfing?: boolean;
  /** Mapa y posición donde el jugador curó por última vez (recuperación tras derrota) */
  lastHealLocation?: { map: MapId; pos: PosType };
  /** Mapas que el jugador ha pisado al menos una vez. Histórico general (lo usa,
   *  p. ej., la inferencia de saves antiguos). El desbloqueo de Vuelo ya NO
   *  depende de esto: ver `unlockedFlyMaps`. */
  visitedMaps?: MapId[];
  /** Mapas cuyo destino de Vuelo el jugador ha DESBLOQUEADO al pisar alguna de
   *  sus `flyUnlockTiles`. Persistido en el save. Un mapa con
   *  `flyAlwaysAvailable` está disponible aunque no aparezca aquí. */
  unlockedFlyMaps?: MapId[];
  /** Datos de confirmación de asistencia a la boda */
  rsvp?: RSVPData;
  /** Contador de pasos para la ganancia de amistad al caminar (Gen II). Cada
   *  STEPS_PER_FRIENDSHIP pasos, el equipo gana amistad. Persistido. */
  friendshipStepCounter?: number;
  /** Árboles de bayas recogidos (Gen II): clave "<mapId>-<x>-<y>" → fecha
   *  local de la última recogida. El árbol rebrota al cambiar de día
   *  (medianoche, hora del dispositivo). Persistido en el save. */
  berryTreesPicked?: Record<string, string>;
}

export interface RSVPData {
  playerName: string;
  companion: string | null;
  children: number;
  allergies: string | null;
  /** Parada de recogida del bus de ida o "none" si no usa bus */
  busOutbound: "none" | "club-tenis" | "pio-xii" | "ardoi";
  busReturn: "none" | "23:00" | "01:30";
  preboda: boolean;
  attended: boolean;
}
