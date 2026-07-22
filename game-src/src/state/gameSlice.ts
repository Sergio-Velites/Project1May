import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { MapId, MapItemType, MapWithPos, TrainerType } from "../maps/map-types";
import palletTown from "../maps/pallet-town";
import houseA2f from "../maps/pallet-town-house-a-2f";
import { getPokemonStats } from "../app/use-pokemon-stats";
import mapData from "../maps/map-data";
import { getMoveMetadata } from "../app/use-move-metadata";
import { ItemType } from "../app/use-item-data";
import { boulderIdAt, canChangeElevation, canWalk, getFenceDirection, isBerryTree, isCuttableTree, isGift, isItem, isPortalTile, isStaticPokemon, isTrainer, isWall, isWater } from "../app/map-helper";
import { BASE_FRIENDSHIP, STEPS_PER_FRIENDSHIP, friendshipOnWalk, getFriendship } from "../app/evolution-helper";
import { rollGender } from "../app/gender-helper";
import {
  Direction,
  GameState,
  InventoryItemType,
  PokemonEncounterType,
  PokemonInstance,
  PosType,
  RSVPData,
} from "./state-types";

const initialState: GameState = {
  pos: { x: 3, y: 6 },
  jumping: false,
  moving: false,
  direction: Direction.Up,
  map: MapId.PalletTownHouseA2F,
  money: 400,
  inventory: [
    {
      item: ItemType.PokeBall,
      amount: 2,
    },
  ],
  name: "Blue",
  pokemon: [],
  pc: [],
  activePokemonIndex: 0,
  trainerEncounter: undefined,
  defeatedTrainers: ["pallet-town-lab-5-1", "pallet-town-house-a-1f-6-3", "pallet-town-10-0", "pallet-town-11-0"],
  collectedItems: [],
  completedQuests: [],
  sessionCutTrees: [] as string[],
  boulderPositions: {} as Record<string, PosType>,
  strengthActive: false,
  flashActive: false,
  seenPokemon: [],
  caughtPokemon: [],
  npcFacings: {} as Record<string, Direction>,
  onBicycle: false,
  onSurfing: false,
  // En el estado inicial ya hay trainers derrotados en pallet-town,
  // pallet-town-house-a-1f y pallet-town-lab, lo que implica que el jugador
  // ya ha pisado esos mapas en el flujo introductorio. Sembramos todos
  // como visitados para que la MO Vuelo permita volver desde el principio
  // si más adelante alguien intenta volar a Pueblo Paleta.
  visitedMaps: [
    MapId.PalletTownHouseA2F,
    MapId.PalletTownHouseA1F,
    MapId.PalletTown,
    MapId.PalletTownLab,
  ],
  // Destinos de Vuelo desbloqueados al pisar sus flyUnlockTiles. Vacío al
  // empezar; los mapas con flyAlwaysAvailable están disponibles sin estar aquí.
  unlockedFlyMaps: [],
  rsvp: undefined,
};

/**
 * Acumula un paso caminado y, cada STEPS_PER_FRIENDSHIP pasos, reparte
 * amistad a todo el equipo (Gen II). Debe llamarse SOLO cuando el jugador
 * se mueve de tile con éxito (no en movimientos bloqueados).
 */
const accrueWalkFriendship = (state: GameState) => {
  if (state.pokemon.length === 0) return;
  const counter = (state.friendshipStepCounter ?? 0) + 1;
  if (counter < STEPS_PER_FRIENDSHIP) {
    state.friendshipStepCounter = counter;
    return;
  }
  state.friendshipStepCounter = 0;
  for (const p of state.pokemon) {
    p.friendship = friendshipOnWalk(getFriendship(p));
  }
};

// Registra un MapId como visitado en `state.visitedMaps` (idempotente).
const recordVisit = (state: GameState, mapId: MapId) => {
  if (!state.visitedMaps) state.visitedMaps = [];
  if (!state.visitedMaps.includes(mapId)) state.visitedMaps.push(mapId);
};

/**
 * Infiere los mapas visitados a partir de un save sin `visitedMaps` (saves
 * anteriores a la feature MO Vuelo). Los IDs de entrenadores derrotados
 * siguen el formato `${mapId}-x-y`, así que para cada uno detectamos qué
 * mapIds son prefijo del ID. Se incluyen también los mapas semilla del
 * estado inicial y el mapa actual del jugador.
 *
 * Esto evita que un save antiguo se quede sin destinos disponibles para
 * Vuelo aunque el jugador ya haya recorrido toda la ruta.
 */
const inferVisitedMaps = (s: GameState): MapId[] => {
  const visited = new Set<MapId>([
    s.map,
    MapId.PalletTownHouseA2F,
    MapId.PalletTownHouseA1F,
    MapId.PalletTown,
    MapId.PalletTownLab,
  ]);
  const allMapIds = Object.values(MapId) as MapId[];
  for (const trainerId of s.defeatedTrainers ?? []) {
    for (const mapId of allMapIds) {
      if (trainerId.startsWith(`${mapId}-`)) visited.add(mapId);
    }
  }
  return Array.from(visited);
};

/** ¿Algún Pokémon del equipo conoce el movimiento Fuerza ("strength")? */
const teamKnowsStrength = (state: GameState): boolean =>
  state.pokemon.some((p) => p.moves?.some((m) => m.id === "strength"));

/**
 * Intenta interactuar con una roca (MO Fuerza) situada en el tile frente al
 * jugador, en la dirección (dx,dy). Devuelve:
 *   - "none"    → no hay roca delante (el reducer sigue con su lógica normal).
 *   - "blocked" → hay roca pero no se puede mover (Fuerza inactiva, sin Pokémon
 *                 que la sepa, o destino bloqueado) → el jugador no avanza.
 *   - "pushed"  → la roca se empujó un tile; el jugador debe avanzar a su hueco.
 *
 * Mutamos `state.boulderPositions` directamente (Immer) al empujar.
 */
const tryBoulderInteraction = (
  state: GameState,
  dx: number,
  dy: number
): "none" | "blocked" | "pushed" => {
  const map = mapData[state.map];
  if (!map.boulders || map.boulders.length === 0) return "none";

  const positions = state.boulderPositions ?? {};
  const tx = state.pos.x + dx;
  const ty = state.pos.y + dy;
  const id = boulderIdAt(map.boulders, tx, ty, positions);
  if (!id) return "none";

  // Hay una roca delante. Sin Fuerza activada (o sin Pokémon que la sepa) la
  // roca bloquea como un muro.
  if (!state.strengthActive || !teamKnowsStrength(state)) return "blocked";

  // Planos de altura: no se puede alcanzar (ni empujar) una roca que está en
  // otro nivel de elevación, salvo mediando una rampa.
  if (!canChangeElevation(map, state.pos.x, state.pos.y, tx, ty)) return "blocked";

  // Tile al otro lado de la roca en la misma dirección.
  const bx = tx + dx;
  const by = ty + dy;
  const map2 = mapData[state.map];
  if (bx < 0 || by < 0 || bx >= map2.width || by >= map2.height) return "blocked";

  const destinationWalkable = canWalk(
    bx,
    by,
    state.map,
    state.collectedItems,
    state.defeatedTrainers,
    [...state.completedQuests, ...(state.sessionCutTrees ?? [])],
    state.pokemon.length > 0,
    !!state.onSurfing,
    positions,
    { x: tx, y: ty } // la roca no cruza bordes de elevación (salvo rampa)
  );
  // No se puede empujar la roca al agua, sobre otra roca, muro, etc.
  if (!destinationWalkable) return "blocked";

  state.boulderPositions = { ...positions, [id]: { x: bx, y: by } };
  return "pushed";
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    moveLeft: (state) => {
      state.direction = Direction.Left;
      if (state.pos.x === 0) {
        // Salir por el borde izquierdo: solo si fuera hay un portal (MapChangeHandler transporta).
        if (isPortalTile(mapData[state.map], -1, state.pos.y)) state.pos.x = -1;
        return;
      }
      const boulder = tryBoulderInteraction(state, -1, 0);
      if (boulder === "blocked") return;
      if (boulder === "pushed") {
        state.pos.x -= 1;
        return;
      }
      // Saliente (ledge) orientado a la izquierda: se cruza de un salto. Los
      // salientes con otra orientación bloquean (canWalk los trata como muro).
      if (getFenceDirection(mapData[state.map], state.pos.x - 1, state.pos.y) === Direction.Left) {
        state.jumping = true;
        state.pos.x -= 1;
        accrueWalkFriendship(state);
        return;
      }
      if (
        !canWalk(state.pos.x - 1, state.pos.y, state.map, state.collectedItems, state.defeatedTrainers, [...state.completedQuests, ...(state.sessionCutTrees ?? [])], state.pokemon.length > 0, !!state.onSurfing, state.boulderPositions ?? {}, { x: state.pos.x, y: state.pos.y })
      )
        return;
      state.pos.x -= 1;
      accrueWalkFriendship(state);
    },
    moveRight: (state) => {
      state.direction = Direction.Right;
      const map = mapData[state.map];
      if (state.pos.x === map.width - 1) {
        if (isPortalTile(map, map.width, state.pos.y)) state.pos.x = map.width;
        return;
      }
      const boulder = tryBoulderInteraction(state, 1, 0);
      if (boulder === "blocked") return;
      if (boulder === "pushed") {
        state.pos.x += 1;
        return;
      }
      // Saliente (ledge) orientado a la derecha: se cruza de un salto.
      if (getFenceDirection(map, state.pos.x + 1, state.pos.y) === Direction.Right) {
        state.jumping = true;
        state.pos.x += 1;
        accrueWalkFriendship(state);
        return;
      }
      if (
        !canWalk(state.pos.x + 1, state.pos.y, state.map, state.collectedItems, state.defeatedTrainers, [...state.completedQuests, ...(state.sessionCutTrees ?? [])], state.pokemon.length > 0, !!state.onSurfing, state.boulderPositions ?? {}, { x: state.pos.x, y: state.pos.y })
      )
        return;
      state.pos.x += 1;
      accrueWalkFriendship(state);
    },
    moveUp: (state) => {
      state.direction = Direction.Up;
      if (state.pos.y === 0) {
        if (isPortalTile(mapData[state.map], state.pos.x, -1)) state.pos.y = -1;
        return;
      }
      const boulder = tryBoulderInteraction(state, 0, -1);
      if (boulder === "blocked") return;
      if (boulder === "pushed") {
        state.pos.y -= 1;
        return;
      }
      // Saliente (ledge) orientado hacia arriba: se cruza de un salto.
      if (getFenceDirection(mapData[state.map], state.pos.x, state.pos.y - 1) === Direction.Up) {
        state.jumping = true;
        state.pos.y -= 1;
        accrueWalkFriendship(state);
        return;
      }
      if (
        !canWalk(state.pos.x, state.pos.y - 1, state.map, state.collectedItems, state.defeatedTrainers, [...state.completedQuests, ...(state.sessionCutTrees ?? [])], state.pokemon.length > 0, !!state.onSurfing, state.boulderPositions ?? {}, { x: state.pos.x, y: state.pos.y })
      )
        return;
      state.pos.y -= 1;
      accrueWalkFriendship(state);
    },
    moveDown: (state) => {
      state.direction = Direction.Down;
      const map = mapData[state.map];
      if (state.pos.y === map.height - 1) {
        if (isPortalTile(map, state.pos.x, map.height)) state.pos.y = map.height;
        return;
      }
      const boulder = tryBoulderInteraction(state, 0, 1);
      if (boulder === "blocked") return;
      if (boulder === "pushed") {
        state.pos.y += 1;
        return;
      }
      const fenceDirDown = getFenceDirection(map, state.pos.x, state.pos.y + 1);
      if (fenceDirDown === Direction.Down) {
        // Saliente orientado hacia abajo: se cruza de un salto (comportamiento
        // clásico). Se mantienen las comprobaciones de muro/agua de más abajo.
        state.jumping = true;
      } else if (fenceDirDown !== null) {
        // Saliente orientado a otro lado: por este flanco se comporta como muro.
        return;
      }
      // Planos de altura: sin rampa no se cruza entre niveles distintos. El
      // salto del saliente (fenceDirDown === Down) es transición legítima.
      if (fenceDirDown === null && !canChangeElevation(map, state.pos.x, state.pos.y, state.pos.x, state.pos.y + 1)) return;
      if (isWall(map.walls, state.pos.x, state.pos.y + 1)) return;
      // Surf: el agua es transitable; la tierra también (al pisarla se
      // activa el desmonte fuera de este reducer). A pie: el agua bloquea.
      if (!state.onSurfing && isWater(map.water, state.pos.x, state.pos.y + 1)) return;
      const hasPokemon = state.pokemon.length > 0;
      const blockingTrainersDown = (map.trainers ?? []).filter((t) => {
        if (t.hideCondition === "has-pokemon" && hasPokemon) return false;
        return true;
      });
      if (isTrainer(blockingTrainersDown, state.pos.x, state.pos.y + 1)) return;
      if (isCuttableTree(map.cuttableTrees, state.pos.x, state.pos.y + 1, [...state.completedQuests, ...(state.sessionCutTrees ?? [])])) return;
      if (isBerryTree(map.berryTrees, state.pos.x, state.pos.y + 1)) return;
      if (isStaticPokemon(map.staticPokemon, state.pos.x, state.pos.y + 1, state.completedQuests)) return;
      if (
        isItem(
          map.items,
          state.pos.x,
          state.pos.y + 1,
          state.collectedItems,
          state.map
        )
      )
        return;
      if (isGift(map.gifts, state.pos.x, state.pos.y + 1, state.completedQuests)) return;
      state.pos.y += 1;
      accrueWalkFriendship(state);
    },
    setPos: (state, action: PayloadAction<PosType>) => {
      state.pos = action.payload;
    },
    setMap: (state, action: PayloadAction<MapId>) => {
      state.map = action.payload;
      const map = mapData[action.payload];
      state.pos = map.start;
      state.npcFacings = {};
      state.sessionCutTrees = [];
      state.boulderPositions = {};
      state.strengthActive = false;
      // MO Destello: la luz se mantiene al pasar entre mapas oscuros y se apaga
      // al entrar en uno no-oscuro (fiel a Pokémon Rojo/Azul).
      state.flashActive = map.dark ? (state.flashActive ?? false) : false;
      // Auto-desmonte si el nuevo mapa no permite bici (interiores).
      if (!map.allowBicycle && state.onBicycle) state.onBicycle = false;
      // El surf se conserva al cambiar de mapa solo si la casilla de aterrizaje
      // es agua (el mapa Y la posición deciden). Si aterrizas en tierra, te
      // bajas — igual que la bici depende de si el mapa la permite.
      if (state.onSurfing) state.onSurfing = isWater(map.water, state.pos.x, state.pos.y);
      recordVisit(state, action.payload);
    },
    setMapWithPos: (state, action: PayloadAction<MapWithPos>) => {
      state.map = action.payload.map;
      state.pos = action.payload.pos;
      state.npcFacings = {};
      state.sessionCutTrees = [];
      state.boulderPositions = {};
      state.strengthActive = false;
      const map = mapData[action.payload.map];
      state.flashActive = map && map.dark ? (state.flashActive ?? false) : false;
      if (map && !map.allowBicycle && state.onBicycle) state.onBicycle = false;
      // Surf conservado solo si la casilla de aterrizaje es agua (mapa + posición).
      if (map && state.onSurfing) state.onSurfing = isWater(map.water, state.pos.x, state.pos.y);
      recordVisit(state, action.payload.map);
    },
    exitMap(state) {
      const map = mapData[state.map];
      if (!map) return;
      if (!map.exitReturnMap) return;
      const previousMap = mapData[map.exitReturnMap];
      if (!previousMap) throw new Error("No previous map");
      const newPos = map.exitReturnPos;
      if (previousMap && newPos) {
        state.map = map.exitReturnMap;
        state.pos = newPos;
        state.npcFacings = {};
        state.sessionCutTrees = [];
      state.boulderPositions = {};
      state.strengthActive = false;
      state.flashActive = previousMap.dark ? (state.flashActive ?? false) : false;
        if (!previousMap.allowBicycle && state.onBicycle) state.onBicycle = false;
        // Surf conservado solo si la casilla de aterrizaje es agua (mapa + posición).
        if (state.onSurfing) state.onSurfing = isWater(previousMap.water, state.pos.x, state.pos.y);
        recordVisit(state, map.exitReturnMap);
      }
    },
    /**
     * Teletransporte de la MO Vuelo. Cambia mapa+posición de forma idéntica a
     * setMapWithPos pero conceptualmente representa el aterrizaje del pajarito
     * en el destino elegido por el jugador.
     */
    flyTo: (state, action: PayloadAction<MapWithPos>) => {
      state.map = action.payload.map;
      state.pos = action.payload.pos;
      state.direction = Direction.Down;
      state.npcFacings = {};
      state.sessionCutTrees = [];
      state.boulderPositions = {};
      state.strengthActive = false;
      const map = mapData[action.payload.map];
      state.flashActive = map && map.dark ? (state.flashActive ?? false) : false;
      if (map && !map.allowBicycle && state.onBicycle) state.onBicycle = false;
      // Volar siempre desmonta el surf (el pajarito no nada).
      state.onSurfing = false;
      recordVisit(state, action.payload.map);
    },
    /**
     * Registra un mapa como destino de Vuelo desbloqueado (el jugador pisó una
     * de sus `flyUnlockTiles`). Idempotente; se persiste al guardar la partida.
     */
    registerFlyUnlock: (state, action: PayloadAction<MapId>) => {
      if (!state.unlockedFlyMaps) state.unlockedFlyMaps = [];
      if (!state.unlockedFlyMaps.includes(action.payload)) {
        state.unlockedFlyMaps.push(action.payload);
      }
    },
    /**
     * Marca que el jugador ya recogió el bebé de la guardería en la fecha dada
     * (formato local "YYYY-M-D"). Hasta el día siguiente no habrá otro.
     */
    claimDayCareGift: (state, action: PayloadAction<string>) => {
      state.dayCareLastGift = action.payload;
    },
    setOnBicycle: (state, action: PayloadAction<boolean>) => {
      state.onBicycle = action.payload;
    },
    setOnSurfing: (state, action: PayloadAction<boolean>) => {
      state.onSurfing = action.payload;
      // Surf y bici son mutuamente excluyentes.
      if (action.payload) state.onBicycle = false;
    },
    setNpcFacing: (
      state,
      action: PayloadAction<{ id: string; direction: Direction }>
    ) => {
      state.npcFacings[action.payload.id] = action.payload.direction;
    },
    setMoving: (state, action: PayloadAction<boolean>) => {
      state.moving = action.payload;
    },
    addInventory: (state, action: PayloadAction<InventoryItemType>) => {
      let found = false;

      for (let i = 0; i < state.inventory.length; i++) {
        if (state.inventory[i].item !== action.payload.item) continue;
        state.inventory[i].amount += action.payload.amount;
        found = true;
      }

      if (!found) {
        state.inventory.push(action.payload);
      }
    },
    removeInventory: (state, action: PayloadAction<InventoryItemType>) => {
      for (let i = 0; i < state.inventory.length; i++) {
        if (state.inventory[i].item !== action.payload.item) continue;
        state.inventory[i].amount -= action.payload.amount;
      }
    },
    consumeItem: (state, action: PayloadAction<ItemType>) => {
      const item = state.inventory.find((i) => i.item === action.payload);
      if (!item) return;
      item.amount -= 1;
    },
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
    },
    save: (state) => {
      localStorage.setItem(state.name, JSON.stringify(state));
    },
    load: (state) => {
      const savedGame = localStorage.getItem(state.name);
      if (!savedGame) return;
      const savedGameState = JSON.parse(savedGame) as GameState;
      state.pos = savedGameState.pos;
      state.direction = savedGameState.direction;
      state.map = savedGameState.map;
      state.inventory = savedGameState.inventory;
      state.name = savedGameState.name;
      state.pokemon = savedGameState.pokemon;
      // No restaurar encuentros activos al cargar save
      state.pokemonEncounter = undefined;
      // Sanitizar índice activo: si apunta fuera del array, fall-back al primer
      // Pokémon vivo (o 0 si todos KO). Sin esto, active === undefined y todas
      // las batallas se cierran al instante.
      const safeIdxLoad = (() => {
        const idx = savedGameState.activePokemonIndex;
        if (idx >= 0 && idx < savedGameState.pokemon.length) return idx;
        const firstAlive = savedGameState.pokemon.findIndex((p) => p.hp > 0);
        return firstAlive >= 0 ? firstAlive : 0;
      })();
      state.activePokemonIndex = safeIdxLoad;
      state.money = savedGameState.money;
      state.pc = savedGameState.pc;
      state.trainerEncounter = undefined;
      state.defeatedTrainers = savedGameState.defeatedTrainers;
      state.collectedItems = savedGameState.collectedItems;
      state.completedQuests = savedGameState.completedQuests;
      state.seenPokemon = savedGameState.seenPokemon ?? [];
      state.caughtPokemon = savedGameState.caughtPokemon ?? [];
      state.onBicycle = savedGameState.onBicycle ?? false;
      state.onSurfing = savedGameState.onSurfing ?? false;
      // Estado de sesión de rocas (MO Fuerza): siempre se reinicia al cargar.
      state.boulderPositions = {};
      state.strengthActive = false;
      state.flashActive = false;
      state.sessionCutTrees = [];
      // UNIÓN (aditiva, nunca quita): mapas ya guardados + los inferidos de
      // defeatedTrainers/semillas/mapa actual. Auto-cura saves con visitedMaps
      // parcial sin riesgo de regresión y habilita Vuelo a toda zona ya pisada.
      state.visitedMaps = Array.from(
        new Set([
          ...(savedGameState.visitedMaps ?? []),
          ...inferVisitedMaps(savedGameState),
        ])
      );
      // Destinos de Vuelo desbloqueados (default [] para saves antiguos).
      state.unlockedFlyMaps = savedGameState.unlockedFlyMaps ?? [];
      state.dayCareLastGift = savedGameState.dayCareLastGift;
      recordVisit(state, savedGameState.map);
    },
    loadFromState: (state, action: PayloadAction<GameState>) => {
      const s = action.payload;
      state.pos = s.pos;
      state.direction = s.direction;
      state.map = s.map;
      state.inventory = s.inventory;
      state.name = s.name;
      state.pokemon = s.pokemon;
      // No restaurar encuentros activos al cargar save — podrían quedar corruptos
      // si el juego crasheó durante un combate. El jugador vuelve al mapa limpio.
      state.pokemonEncounter = undefined;
      // Sanitizar índice activo: si apunta fuera del array, fall-back al primer
      // Pokémon vivo (o 0). Soluciona saves con activePokemonIndex inválido
      // (causa: depositar al PC sin reajustar el índice).
      const safeIdx = (() => {
        const idx = s.activePokemonIndex;
        if (idx >= 0 && idx < s.pokemon.length) return idx;
        const firstAlive = s.pokemon.findIndex((p) => p.hp > 0);
        return firstAlive >= 0 ? firstAlive : 0;
      })();
      state.activePokemonIndex = safeIdx;
      state.money = s.money;
      state.pc = s.pc;
      state.trainerEncounter = undefined;
      state.defeatedTrainers = s.defeatedTrainers;
      state.collectedItems = s.collectedItems;
      state.completedQuests = s.completedQuests;
      state.seenPokemon = s.seenPokemon ?? [];
      state.caughtPokemon = s.caughtPokemon ?? [];
      state.onBicycle = s.onBicycle ?? false;
      state.onSurfing = s.onSurfing ?? false;
      // Estado de sesión de rocas (MO Fuerza): siempre se reinicia al cargar.
      state.boulderPositions = {};
      state.strengthActive = false;
      state.flashActive = false;
      state.sessionCutTrees = [];
      // UNIÓN (aditiva, nunca quita): ver nota en `load`. Auto-cura saves con
      // visitedMaps parcial y habilita Vuelo a toda zona ya visitada.
      state.visitedMaps = Array.from(
        new Set([...(s.visitedMaps ?? []), ...inferVisitedMaps(s)])
      );
      // Destinos de Vuelo desbloqueados (default [] para saves antiguos).
      state.unlockedFlyMaps = s.unlockedFlyMaps ?? [];
      state.dayCareLastGift = s.dayCareLastGift;
      state.lastHealLocation = s.lastHealLocation ?? undefined;
      // Árboles de bayas (Gen II): restaurar fechas de recogida del save.
      state.berryTreesPicked = s.berryTreesPicked ?? {};
      // Guardar al máximo 6 pokémon en equipo (integridad del save)
      if (state.pokemon.length > 6) state.pokemon = state.pokemon.slice(0, 6);
      // Migración Gen II: los saves anteriores al sistema de género no traen
      // el campo → se sortea aquí una vez y queda persistido al guardar.
      for (const p of [...state.pokemon, ...state.pc]) {
        if (p.gender === undefined) p.gender = rollGender(p.id);
      }
      recordVisit(state, s.map);
      if (s.rsvp) state.rsvp = s.rsvp;
    },
    setRsvpInternal: (state, action: PayloadAction<RSVPData>) => {
      state.rsvp = action.payload;
    },
    swapPokemonPositions: (state, action: PayloadAction<number[]>) => {
      const [index1, index2] = action.payload;
      const temp = state.pokemon[index1];
      state.pokemon[index1] = state.pokemon[index2];
      state.pokemon[index2] = temp;
    },
    encounterPokemon: (state, action: PayloadAction<PokemonEncounterType>) => {
      state.pokemonEncounter = action.payload;
    },
    endEncounter: (state) => {
      state.pokemonEncounter = undefined;
    },
    setActivePokemon: (state, action: PayloadAction<number>) => {
      state.activePokemonIndex = action.payload;
    },
    updatePokemonEncounter: (
      state,
      action: PayloadAction<PokemonEncounterType>
    ) => {
      if (!state.pokemonEncounter) return;
      state.pokemonEncounter.hp = action.payload.hp;
    },
    updatePokemon: (state, action: PayloadAction<PokemonInstance>) => {
      state.pokemon[state.activePokemonIndex] = action.payload;
    },
    updateSpecificPokemon: (
      state,
      action: PayloadAction<{ index: number; pokemon: PokemonInstance }>
    ) => {
      state.pokemon[action.payload.index] = action.payload.pokemon;
    },
    /**
     * Intercambio del Club Cable (Gen II): el Pokémon en `giveIndex` se va
     * con el otro invitado y `received` ocupa su hueco. Es simultáneo, así
     * que el equipo nunca queda vacío. Marca la Pokédex como visto+capturado
     * (igual que el original al recibir por cable).
     */
    applyTrade: (
      state,
      action: PayloadAction<{ giveIndex: number; received: PokemonInstance }>
    ) => {
      const { giveIndex, received } = action.payload;
      if (giveIndex < 0 || giveIndex >= state.pokemon.length) return;
      state.pokemon[giveIndex] = received;
      if (!state.seenPokemon.includes(received.id)) {
        state.seenPokemon.push(received.id);
      }
      if (!state.caughtPokemon.includes(received.id)) {
        state.caughtPokemon.push(received.id);
      }
    },
    /** Marca un árbol de bayas como recogido hoy (Gen II). */
    pickBerryTree: (
      state,
      action: PayloadAction<{ treeKey: string; date: string }>
    ) => {
      if (!state.berryTreesPicked) state.berryTreesPicked = {};
      state.berryTreesPicked[action.payload.treeKey] = action.payload.date;
    },
    /** Equipa o retira (item: null) el objeto de un Pokémon del equipo (Gen II). */
    setHeldItem: (
      state,
      action: PayloadAction<{ index: number; item: ItemType | null }>
    ) => {
      const p = state.pokemon[action.payload.index];
      if (!p) return;
      p.heldItem = action.payload.item;
    },
    /**
     * Intercambia dos movimientos del pokémon activo (estilo Select de Gen I).
     * Persiste tras guardar/cargar porque viven en `pokemon[i].moves`.
     */
    swapMoves: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const idx = state.activePokemonIndex;
      const p = state.pokemon[idx];
      if (!p) return;
      const { fromIndex, toIndex } = action.payload;
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= p.moves.length ||
        toIndex >= p.moves.length ||
        fromIndex === toIndex
      ) return;
      const tmp = p.moves[fromIndex];
      p.moves[fromIndex] = p.moves[toIndex];
      p.moves[toIndex] = tmp;
    },
    /**
     * Asigna (o limpia con null) el estado persistente de un Pokémon concreto.
     * Se invoca desde el sistema de combate cuando un movimiento aplica
     * envenenamiento, quemadura, parálisis, sueño o congelación, y al
     * actualizar el contador de tóxico al final de cada turno.
     */
    setPokemonStatus: (
      state,
      action: PayloadAction<{ index: number; status: { type: string; turns: number } | null }>
    ) => {
      const p = state.pokemon[action.payload.index];
      if (!p) return;
      p.status = action.payload.status as PokemonInstance["status"];
    },
    healPokemon: (state) => {
      // Heal: HP máximo, PP máximo y elimina TODO estado persistente
      for (let i = 0; i < state.pokemon.length; i++) {
        state.pokemon[i].hp = getPokemonStats(
          state.pokemon[i].id,
          state.pokemon[i].level
        ).hp;
        for (let j = 0; j < state.pokemon[i].moves.length; j++) {
          state.pokemon[i].moves[j].pp =
            getMoveMetadata(state.pokemon[i].moves[j].id).pp || 0;
        }
        state.pokemon[i].status = null;
      }
      // Registrar el último centro donde se curó (para recuperación tras derrota)
      // Resolvemos la ubicación exterior del centro subiendo por exitReturnMap
      const resolveHealLocation = (mapId: MapId): { map: MapId; pos: PosType } => {
        const m = mapData[mapId];
        if (m.recoverLocation) return { map: mapId, pos: m.recoverLocation };
        if (m.exitReturnMap && m.exitReturnPos)
          return { map: m.exitReturnMap, pos: m.exitReturnPos };
        // Fallback: posición actual
        return { map: state.map, pos: state.pos };
      };
      state.lastHealLocation = resolveHealLocation(state.map);
    },
    recoverFromFainting: (state) => {
      // Heal completo + limpia estados persistentes
      for (let i = 0; i < state.pokemon.length; i++) {
        state.pokemon[i].hp = getPokemonStats(
          state.pokemon[i].id,
          state.pokemon[i].level
        ).hp;
        for (let j = 0; j < state.pokemon[i].moves.length; j++) {
          state.pokemon[i].moves[j].pp =
            getMoveMetadata(state.pokemon[i].moves[j].id).pp || 0;
        }
        state.pokemon[i].status = null;
      }

      // Teleportar al último centro donde curó (si lo hay) o al recoverLocation del mapa
      if (state.lastHealLocation) {
        state.map = state.lastHealLocation.map;
        state.pos = state.lastHealLocation.pos;
        state.npcFacings = {} as Record<string, Direction>;
        return;
      }
      const getRecoverLocation = (map: MapId): { map: MapId; pos: PosType } => {
        const mapData_ = mapData[map];
        if (mapData_.recoverLocation) {
          return { map, pos: mapData_.recoverLocation };
        }
        if (!mapData_.exitReturnMap) throw new Error("No exit return map");
        return getRecoverLocation(mapData_.exitReturnMap);
      };
      const { map, pos } = getRecoverLocation(state.map);
      state.map = map;
      state.pos = pos;
      state.npcFacings = {} as Record<string, Direction>;
    },
    resetActivePokemon: (state) => {
      let fistIndexWithHp = 0;
      for (let i = 0; i < state.pokemon.length; i++) {
        if (state.pokemon[i].hp > 0) {
          fistIndexWithHp = i;
          break;
        }
      }
      state.activePokemonIndex = fistIndexWithHp;
    },
    addPokemon: (state, action: PayloadAction<PokemonInstance>) => {
      // Cualquier Pokémon obtenido (starter, regalo, captura, academia, etc.)
      // queda automáticamente registrado como visto y capturado en la Pokédex.
      // Esto evita tener que duplicar dispatches en cada componente que llame
      // a addPokemon.
      const id = action.payload.id;
      // Amistad base (Gen II) si quien lo crea no la especificó.
      if (action.payload.friendship === undefined) {
        action.payload.friendship = BASE_FRIENDSHIP;
      }
      // Género (Gen II): se sortea una única vez al obtener el Pokémon.
      if (action.payload.gender === undefined) {
        action.payload.gender = rollGender(id);
      }
      if (!state.seenPokemon.includes(id)) state.seenPokemon.push(id);
      if (!state.caughtPokemon.includes(id)) state.caughtPokemon.push(id);
      if (state.pokemon.length === 6) {
        state.pc.push(action.payload);
        return;
      }
      state.pokemon.push(action.payload);
    },
    stopJumping: (state) => {
      state.jumping = false;
    },
    depositPokemonToPc: (state, action: PayloadAction<number>) => {
      const pokemon = state.pokemon.splice(action.payload, 1);
      state.pc.push(pokemon[0]);
      // Reajustar índice activo si apunta fuera del array tras depositar.
      // Sin esto, active === undefined y todas las batallas se cierran al instante.
      if (state.activePokemonIndex >= state.pokemon.length) {
        const firstAlive = state.pokemon.findIndex((p) => p.hp > 0);
        state.activePokemonIndex = firstAlive >= 0 ? firstAlive : 0;
      } else if (action.payload < state.activePokemonIndex) {
        // Si el depositado estaba antes del activo, el activo se desplaza una posición.
        state.activePokemonIndex -= 1;
      }
    },
    withdrawPokemonFromPc: (state, action: PayloadAction<number>) => {
      if (state.pokemon.length === 6) throw new Error("No space in party");
      const pokemon = state.pc.splice(action.payload, 1);
      state.pokemon.push(pokemon[0]);
    },
    gainMoney: (state, action: PayloadAction<number>) => {
      state.money += action.payload;
    },
    takeMoney: (state, action: PayloadAction<number>) => {
      state.money = Math.max(0, state.money - action.payload);
    },
    encounterTrainer: (state, action: PayloadAction<TrainerType>) => {
      state.trainerEncounter = action.payload;
    },
    defeatTrainer: (state) => {
      if (!state.trainerEncounter) throw new Error("No trainer encounter");
      // Las batallas online no se guardan en defeatedTrainers (son repetibles)
      if (state.trainerEncounter.isOnline) {
        state.trainerEncounter = undefined;
        return;
      }
      const id = `${state.map}-${state.trainerEncounter.pos.x}-${state.trainerEncounter.pos.y}`;
      state.defeatedTrainers.push(id);
      state.trainerEncounter = undefined;
    },
    faintToTrainer: (state) => {
      state.trainerEncounter = undefined;
    },
    collectItem: (state, action: PayloadAction<MapItemType>) => {
      const id = `${state.map}-${action.payload.pos.x}-${action.payload.pos.y}`;
      state.collectedItems.push(id);
    },
    completeQuest: (state, action: PayloadAction<string>) => {
      state.completedQuests.push(action.payload);
    },
    markTreeCut: (state, action: PayloadAction<string>) => {
      if (!state.sessionCutTrees) state.sessionCutTrees = [];
      if (!state.sessionCutTrees.includes(action.payload)) {
        state.sessionCutTrees.push(action.payload);
      }
    },
    /** Activa/desactiva la MO Fuerza en el mapa actual (mover rocas). */
    setStrengthActive: (state, action: PayloadAction<boolean>) => {
      state.strengthActive = action.payload;
    },
    setFlashActive: (state, action: PayloadAction<boolean>) => {
      state.flashActive = action.payload;
    },
    seePokemon: (state, action: PayloadAction<number>) => {
      if (!state.seenPokemon.includes(action.payload)) {
        state.seenPokemon.push(action.payload);
      }
    },
    catchPokemonPokedex: (state, action: PayloadAction<number>) => {
      if (!state.seenPokemon.includes(action.payload)) {
        state.seenPokemon.push(action.payload);
      }
      if (!state.caughtPokemon.includes(action.payload)) {
        state.caughtPokemon.push(action.payload);
      }
    },
  },
});

export const {
  moveLeft,
  moveRight,
  moveUp,
  moveDown,
  setMap,
  setPos,
  setMapWithPos,
  flyTo,
  registerFlyUnlock,
  claimDayCareGift,
  exitMap,
  setMoving,
  addInventory,
  healPokemon,
  removeInventory,
  consumeItem,
  setName,
  save,
  load,
  loadFromState,
  swapPokemonPositions,
  encounterPokemon,
  endEncounter,
  setActivePokemon,
  updatePokemonEncounter,
  updatePokemon,
  updateSpecificPokemon,
  applyTrade,
  pickBerryTree,
  setHeldItem,
  swapMoves,
  setPokemonStatus,
  recoverFromFainting,
  resetActivePokemon,
  addPokemon,
  stopJumping,
  depositPokemonToPc,
  withdrawPokemonFromPc,
  gainMoney,
  takeMoney,
  encounterTrainer,
  defeatTrainer,
  faintToTrainer,
  collectItem,
  completeQuest,
  markTreeCut,
  setStrengthActive,
  setFlashActive,
  seePokemon,
  catchPokemonPokedex,
  setNpcFacing,
  setOnBicycle,
  setOnSurfing,
  setRsvpInternal,
} = gameSlice.actions;

export const setRsvp = setRsvpInternal;
export const selectPos = (state: RootState) => state.game.pos;

export const selectMap = (state: RootState) => mapData[state.game.map];

export const selectDirection = (state: RootState) => state.game.direction;

export const selectMoving = (state: RootState) => state.game.moving;

export const selectInventory = (state: RootState) => state.game.inventory;

export const selectMoney = (state: RootState) => state.game.money;

export const selectPreviousMap = (state: RootState) => {
  const returnMap = mapData[state.game.map].exitReturnMap;
  if (!returnMap) return null;
  return mapData[returnMap];
};

export const selectName = (state: RootState) => state.game.name;

export const selectHasSave = () => localStorage.getItem("game") !== null;

export const selectPokemon = (state: RootState) => state.game.pokemon;

export const selectPokemonEncounter = (state: RootState) =>
  state.game.pokemonEncounter;

export const selectActivePokemon = (state: RootState) =>
  state.game.pokemon[state.game.activePokemonIndex];

export const selectJumping = (state: RootState) => state.game.jumping;

export const selectPc = (state: RootState) => state.game.pc;

export const selectTrainerEncounter = (state: RootState) =>
  state.game.trainerEncounter;

export const selectDefeatedTrainers = (state: RootState) =>
  state.game.defeatedTrainers;

export const selectMapId = (state: RootState) => state.game.map;

export const selectOnBicycle = (state: RootState) => !!state.game.onBicycle;
export const selectOnSurfing = (state: RootState) => !!state.game.onSurfing;
export const selectVisitedMaps = (state: RootState) =>
  state.game.visitedMaps ?? [];
export const selectUnlockedFlyMaps = (state: RootState) =>
  state.game.unlockedFlyMaps ?? [];
export const selectDayCareLastGift = (state: RootState) =>
  state.game.dayCareLastGift;

export const selectCollectedItems = (state: RootState) =>
  state.game.collectedItems;

export const selectCompletedQuests = (state: RootState) =>
  state.game.completedQuests;

export const selectSessionCutTrees = (state: RootState) =>
  state.game.sessionCutTrees ?? [];

export const selectBoulderPositions = (state: RootState) =>
  state.game.boulderPositions ?? {};

export const selectBerryTreesPicked = (state: RootState) =>
  state.game.berryTreesPicked ?? {};

export const selectStrengthActive = (state: RootState) =>
  state.game.strengthActive ?? false;
export const selectFlashActive = (state: RootState) =>
  state.game.flashActive ?? false;

/**
 * Pokédex: la lista persistida puede estar incompleta para saves antiguos
 * o para pokémon hardcodeados (iniciales, regalos) que se asignaron antes
 * de que `addPokemon` marcara la captura. Calculamos la unión con el
 * equipo actual y el PC para garantizar que TODO pokémon que el jugador
 * posee aparece como visto+capturado en la Pokédex.
 */
export const selectSeenPokemon = (state: RootState) => {
  const owned = [
    ...state.game.pokemon.map((p) => p.id),
    ...state.game.pc.map((p) => p.id),
  ];
  const set = new Set<number>([...state.game.seenPokemon, ...owned]);
  return Array.from(set);
};
export const selectCaughtPokemon = (state: RootState) => {
  const owned = [
    ...state.game.pokemon.map((p) => p.id),
    ...state.game.pc.map((p) => p.id),
  ];
  const set = new Set<number>([...state.game.caughtPokemon, ...owned]);
  return Array.from(set);
};

export const selectActivePokemonIndex = (state: RootState) =>
  state.game.activePokemonIndex;

export const selectNpcFacings = (state: RootState) => state.game.npcFacings;

export const selectGameState = (state: RootState) => state.game;

export default gameSlice.reducer;
