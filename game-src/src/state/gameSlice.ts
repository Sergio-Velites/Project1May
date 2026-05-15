import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { MapId, MapItemType, MapWithPos, TrainerType } from "../maps/map-types";
import palletTown from "../maps/pallet-town";
import houseA2f from "../maps/house-a-2f";
import { getPokemonStats } from "../app/use-pokemon-stats";
import mapData from "../maps/map-data";
import { getMoveMetadata } from "../app/use-move-metadata";
import { ItemType } from "../app/use-item-data";
import { canWalk, isFence, isGift, isItem, isStaticPokemon, isTrainer, isWall, isWater, mapHasWater } from "../app/map-helper";
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
  seenPokemon: [],
  caughtPokemon: [],
  npcFacings: {} as Record<string, Direction>,
  onBicycle: false,
  onSurfing: false,
  rsvp: undefined,
};

export const gameSlice = createSlice({
  name: "game",
  initialState,
  reducers: {
    moveLeft: (state) => {
      state.direction = Direction.Left;
      if (state.pos.x === 0) return;
      if (
        !canWalk(state.pos.x - 1, state.pos.y, state.map, state.collectedItems, state.defeatedTrainers, state.completedQuests, state.pokemon.length > 0, !!state.onSurfing)
      )
        return;
      state.pos.x -= 1;
    },
    moveRight: (state) => {
      state.direction = Direction.Right;
      const map = mapData[state.map];
      if (state.pos.x === map.width - 1) return;
      if (
        !canWalk(state.pos.x + 1, state.pos.y, state.map, state.collectedItems, state.defeatedTrainers, state.completedQuests, state.pokemon.length > 0, !!state.onSurfing)
      )
        return;
      state.pos.x += 1;
    },
    moveUp: (state) => {
      state.direction = Direction.Up;
      if (state.pos.y === 0) return;
      if (
        !canWalk(state.pos.x, state.pos.y - 1, state.map, state.collectedItems, state.defeatedTrainers, state.completedQuests, state.pokemon.length > 0, !!state.onSurfing)
      )
        return;
      state.pos.y -= 1;
    },
    moveDown: (state) => {
      state.direction = Direction.Down;
      const map = mapData[state.map];
      if (state.pos.y === map.height - 1) return;
      if (isFence(map.fences, state.pos.x, state.pos.y + 1)) {
        state.jumping = true;
      }
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
    },
    setPos: (state, action: PayloadAction<PosType>) => {
      state.pos = action.payload;
    },
    setMap: (state, action: PayloadAction<MapId>) => {
      state.map = action.payload;
      const map = mapData[action.payload];
      state.pos = map.start;
      state.npcFacings = {};
      // Auto-desmonte si el nuevo mapa no permite bici (interiores).
      if (!map.allowBicycle && state.onBicycle) state.onBicycle = false;
      // Auto-desmonte de surf si el nuevo mapa no tiene tiles de agua.
      if (state.onSurfing && !mapHasWater(map)) state.onSurfing = false;
    },
    setMapWithPos: (state, action: PayloadAction<MapWithPos>) => {
      state.map = action.payload.map;
      state.pos = action.payload.pos;
      state.npcFacings = {};
      const map = mapData[action.payload.map];
      if (map && !map.allowBicycle && state.onBicycle) state.onBicycle = false;
      if (map && state.onSurfing && !mapHasWater(map)) state.onSurfing = false;
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
        if (!previousMap.allowBicycle && state.onBicycle) state.onBicycle = false;
        if (state.onSurfing && !mapHasWater(previousMap)) state.onSurfing = false;
      }
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
      state.money -= action.payload;
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

export const selectCollectedItems = (state: RootState) =>
  state.game.collectedItems;

export const selectCompletedQuests = (state: RootState) =>
  state.game.completedQuests;

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
