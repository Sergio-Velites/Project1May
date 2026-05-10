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

export interface PokemonInstance {
  id: number;
  level: number;
  xp: number;
  hp: number;
  moves: MoveState[];
}

export interface PokemonEncounterType {
  id: number;
  level: number;
  hp: number;
  moves: string[];
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
  seenPokemon: number[];    // IDs vistos en la Pokédex
  caughtPokemon: number[]; // IDs capturados
  npcFacings: Record<string, Direction>;
  /** Mapa y posición donde el jugador curó por última vez (recuperación tras derrota) */
  lastHealLocation?: { map: MapId; pos: PosType };
  /** Datos de confirmación de asistencia a la boda */
  rsvp?: RSVPData;
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
