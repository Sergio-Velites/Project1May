import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { ItemType } from "../app/use-item-data";
import { Direction, PosType } from "./state-types";
import { MapId, SimpleGiftType, TextReward } from "../maps/map-types";

interface TextThenActionType {
  text: string[];
  action: () => void;
}

interface LearningMoveType {
  itemName: string;
  move: string;
  consume: boolean;
  item: ItemType;
  /** Cuando se lanza desde RareCandy: índice del pokémon ya seleccionado.
   *  Si está definido, LearnMove salta las pantallas de selección TM/HM. */
  preselectedPokemonIndex?: number;
}

interface ConfimationMenuType {
  preMessage: string;
  postMessage: string;
  confirm: () => void;
  cancel?: () => void;
}

interface EvolutionType {
  index: number;
  evolveToId: number;
}

/**
 * Sesión de pesca activa. La inicia el `action` del item caña tras
 * comprobar agua adyacente. La fase la gestiona el componente FishingSession.
 */
export interface FishingState {
  rod: "old-rod" | "good-rod" | "super-rod";
  direction: Direction;
  /** Tile de agua frente al jugador (para anclar el sprite de la caña). */
  waterPos: { x: number; y: number };
}

/**
 * Sesión de knockback activa: el jugador es empujado en `direction` hasta
 * chocar con un wall/fence/límite o cruzar un exit/teleport.
 * Bloquea inputs durante toda la duración.
 */
export interface KnockbackState {
  direction: Direction;
}

/**
 * Animación de Vuelo (MO02). Tres fases:
 *  - "takeoff"  : el pajarito sube con el jugador y sale por arriba.
 *  - "transit"  : pantalla negra; se aplica el `flyTo` en el reducer y se
 *    cambia a la fase de aterrizaje en el siguiente tick.
 *  - "landing"  : el pajarito desciende en el destino y desaparece.
 * `destination` se conserva durante todas las fases para que el componente
 * de animación sepa adónde aplicar `flyTo`.
 */
export interface FlyAnimationState {
  phase: "takeoff" | "transit" | "landing";
  destination: { map: MapId; pos: PosType };
}

interface UiState {
  text: string[] | null;
  startMenu: boolean;
  itemsMenu: boolean;
  playerMenu: boolean;
  titleMenu: boolean;
  loadMenu: boolean;
  gameboyMenu: boolean;
  videoShown: boolean;
  pokemonCenterMenu: boolean;
  pcMenu: boolean;
  pokeMartMenu: boolean;
  pokedexOpen: boolean;
  actionOnPokemon: ((index: number) => void) | null;
  pokeballThrowing?: ItemType | null;
  spinning: Direction | null;
  textThenAction: TextThenActionType | null;
  learningMove: LearningMoveType | null;
  blackScreen: boolean;
  confirmationMenu: ConfimationMenuType | null;
  evolution: EvolutionType | null;
  pokeballCardId: number | null;
  academyPokeballOpen: boolean;
  onlineBattleMenu: boolean;
  mapGiftPending: SimpleGiftType | null;
  textRewardPending: TextReward | null;
  /** Sesión de pesca activa (animación + tirada). */
  fishing: FishingState | null;
  /** Sesión de knockback activa (empuje del jugador). */
  knockback: KnockbackState | null;
  /** Menú de selección de destino para la MO Vuelo. */
  flyMenu: boolean;
  /** Animación de vuelo en curso (pajarito subiendo/aterrizando). */
  flyAnimation: FlyAnimationState | null;
  /**
   * Petición pendiente de aplicar CONFUSIÓN al pokémon en combate (índice
   * del equipo) tras usar un objeto. PokemonEncounter la observa y, si el
   * pokémon coincide con el activo y hay batalla en curso, aplica la
   * confusión durante los próximos `turns` turnos.
   * `tick` se incrementa por cada petición para forzar el efecto aunque
   * los demás campos coincidan.
   */
  pendingConfusionFromItem: { pokemonIndex: number; turns: number; tick: number } | null;
  // Counter incrementado cada vez que el jugador consume su turno de combate
  // sin atacar (cambio de Pokémon o uso de objeto). PokemonEncounter lo
  // observa para encadenar el ataque del rival inmediatamente después.
  playerTurnTick: number;
  /** Indica que la intro de Oak está activa → SoundHandler reproduce la música del profesor. */
  oakIntroActive: boolean;
}

const initialState: UiState = {
  text: null,
  startMenu: false,
  itemsMenu: false,
  playerMenu: false,
  titleMenu: false,
  loadMenu: true,
  gameboyMenu: true,
  videoShown: false,
  actionOnPokemon: null,
  pokeballThrowing: null,
  pokemonCenterMenu: false,
  pcMenu: false,
  pokeMartMenu: false,
  pokedexOpen: false,
  spinning: null,
  textThenAction: null,
  learningMove: null,
  blackScreen: false,
  confirmationMenu: null,
  evolution: null,
  pokeballCardId: null,
  academyPokeballOpen: false,
  onlineBattleMenu: false,
  mapGiftPending: null,
  textRewardPending: null,
  fishing: null,
  knockback: null,
  flyMenu: false,
  flyAnimation: null,
  pendingConfusionFromItem: null,
  playerTurnTick: 0,
  oakIntroActive: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showStartMenu: (state) => {
      state.startMenu = true;
    },
    hideStartMenu: (state) => {
      state.startMenu = false;
    },
    showItemsMenu: (state) => {
      state.itemsMenu = true;
    },
    hideItemsMenu: (state) => {
      state.itemsMenu = false;
    },
    showPlayerMenu: (state) => {
      state.playerMenu = true;
    },
    hidePlayerMenu: (state) => {
      state.playerMenu = false;
    },
    showTitleMenu: (state) => {
      state.titleMenu = true;
      state.videoShown = true;
    },
    hideTitleMenu: (state) => {
      state.titleMenu = false;
    },
    hideLoadMenu: (state) => {
      state.loadMenu = false;
    },
    hideGameboyMenu: (state) => {
      state.gameboyMenu = false;
    },
    showText: (state, action: PayloadAction<string[]>) => {
      state.text = action.payload;
    },
    hideText: (state) => {
      state.text = null;
    },
    showActionOnPokemon: (
      state,
      action: PayloadAction<(index: number) => void>
    ) => {
      state.actionOnPokemon = action.payload;
    },
    hideActionOnPokemon: (state) => {
      state.actionOnPokemon = null;
    },
    throwPokeball: (state, action: PayloadAction<ItemType>) => {
      state.pokeballThrowing = action.payload;
    },
    stopThrowingPokeball: (state) => {
      state.pokeballThrowing = null;
    },
    showPokemonCenterMenu: (state) => {
      state.pokemonCenterMenu = true;
    },
    hidePokemonCenterMenu: (state) => {
      state.pokemonCenterMenu = false;
    },
    showPcMenu: (state) => {
      state.pcMenu = true;
    },
    hidePcMenu: (state) => {
      state.pcMenu = false;
    },
    showPokeMartMenu: (state) => {
      state.pokeMartMenu = true;
    },
    hidePokeMartMenu: (state) => {
      state.pokeMartMenu = false;
    },
    showPokedex: (state) => {
      state.pokedexOpen = true;
    },
    hidePokedex: (state) => {
      state.pokedexOpen = false;
    },
    startSpinning: (stage, action: PayloadAction<Direction>) => {
      stage.spinning = action.payload;
    },
    stopSpinning: (stage) => {
      stage.spinning = null;
    },
    showTextThenAction: (
      state,
      action: PayloadAction<TextThenActionType | null>
    ) => {
      state.textThenAction = action.payload;
    },
    hideTextThenAction: (state) => {
      state.textThenAction = null;
    },
    learnMove: (state, action: PayloadAction<LearningMoveType | null>) => {
      state.learningMove = action.payload;
    },
    stopLearningMove: (state) => {
      state.learningMove = null;
    },
    setBlackScreen: (state, action: PayloadAction<boolean>) => {
      state.blackScreen = action.payload;
    },
    showConfirmationMenu: (
      state,
      action: PayloadAction<ConfimationMenuType>
    ) => {
      state.confirmationMenu = action.payload;
    },
    hideConfirmationMenu: (state) => {
      state.confirmationMenu = null;
    },
    showEvolution: (state, action: PayloadAction<EvolutionType>) => {
      state.evolution = action.payload;
    },
    hideEvolution: (state) => {
      state.evolution = null;
    },
    openPokeballCard: (state, action: PayloadAction<number>) => {
      state.pokeballCardId = action.payload;
    },
    closePokeballCard: (state) => {
      state.pokeballCardId = null;
    },
    openAcademyPokeball: (state) => {
      state.academyPokeballOpen = true;
    },
    closeAcademyPokeball: (state) => {
      state.academyPokeballOpen = false;
    },
    showOnlineBattleMenu: (state) => {
      state.onlineBattleMenu = true;
    },
    hideOnlineBattleMenu: (state) => {
      state.onlineBattleMenu = false;
    },
    openMapGift: (state, action: PayloadAction<SimpleGiftType>) => {
      state.mapGiftPending = action.payload;
    },
    closeMapGift: (state) => {
      state.mapGiftPending = null;
    },
    openTextReward: (state, action: PayloadAction<TextReward>) => {
      state.textRewardPending = action.payload;
    },
    closeTextReward: (state) => {
      state.textRewardPending = null;
    },
    incrementPlayerTurnTick: (state) => {
      state.playerTurnTick += 1;
    },
    startFishing: (state, action: PayloadAction<FishingState>) => {
      state.fishing = action.payload;
    },
    endFishing: (state) => {
      state.fishing = null;
    },
    startKnockback: (state, action: PayloadAction<KnockbackState>) => {
      state.knockback = action.payload;
    },
    endKnockback: (state) => {
      state.knockback = null;
    },
    showFlyMenu: (state) => {
      state.flyMenu = true;
    },
    hideFlyMenu: (state) => {
      state.flyMenu = false;
    },
    startFlyAnimation: (
      state,
      action: PayloadAction<{ map: MapId; pos: PosType }>
    ) => {
      state.flyAnimation = { phase: "takeoff", destination: action.payload };
    },
    setFlyPhase: (
      state,
      action: PayloadAction<"takeoff" | "transit" | "landing">
    ) => {
      if (state.flyAnimation) state.flyAnimation.phase = action.payload;
    },
    endFlyAnimation: (state) => {
      state.flyAnimation = null;
    },
    requestConfusionFromItem: (
      state,
      action: PayloadAction<{ pokemonIndex: number; turns: number }>
    ) => {
      const prevTick = state.pendingConfusionFromItem?.tick ?? 0;
      state.pendingConfusionFromItem = {
        pokemonIndex: action.payload.pokemonIndex,
        turns: action.payload.turns,
        tick: prevTick + 1,
      };
    },
    consumePendingConfusionFromItem: (state) => {
      state.pendingConfusionFromItem = null;
    },
    showOakIntro: (state) => {
      state.oakIntroActive = true;
    },
    hideOakIntro: (state) => {
      state.oakIntroActive = false;
    },
  },
});

export const {
  showStartMenu,
  hideStartMenu,
  showItemsMenu,
  hideItemsMenu,
  showPlayerMenu,
  hidePlayerMenu,
  showTitleMenu,
  hideTitleMenu,
  hideLoadMenu,
  hideGameboyMenu,
  showText,
  hideText,
  showActionOnPokemon,
  hideActionOnPokemon,
  throwPokeball,
  stopThrowingPokeball,
  showPokemonCenterMenu,
  hidePokemonCenterMenu,
  showPcMenu,
  hidePcMenu,
  showPokeMartMenu,
  hidePokeMartMenu,
  showPokedex,
  hidePokedex,
  startSpinning,
  stopSpinning,
  showTextThenAction,
  hideTextThenAction,
  learnMove,
  stopLearningMove,
  setBlackScreen,
  showConfirmationMenu,
  hideConfirmationMenu,
  showEvolution,
  hideEvolution,
  openPokeballCard,
  closePokeballCard,
  openAcademyPokeball,
  closeAcademyPokeball,
  showOnlineBattleMenu,
  hideOnlineBattleMenu,
  openMapGift,
  closeMapGift,
  openTextReward,
  closeTextReward,
  incrementPlayerTurnTick,
  startFishing,
  endFishing,
  startKnockback,
  endKnockback,
  showFlyMenu,
  hideFlyMenu,
  startFlyAnimation,
  setFlyPhase,
  endFlyAnimation,
  requestConfusionFromItem,
  consumePendingConfusionFromItem,
  showOakIntro,
  hideOakIntro,
} = uiSlice.actions;

export const selectText = (state: RootState) => state.ui.text;

export const selectStartMenu = (state: RootState) => state.ui.startMenu;

export const selectTextMenu = (state: RootState) => state.ui.text !== null;

export const selectItemsMenu = (state: RootState) => state.ui.itemsMenu;

export const selectPlayerMenu = (state: RootState) => state.ui.playerMenu;

export const selectTitleMenu = (state: RootState) => state.ui.titleMenu;

export const selectLoadMenu = (state: RootState) => state.ui.loadMenu;

export const selectGameboyMenu = (state: RootState) => state.ui.gameboyMenu;

export const selectVideoShown = (state: RootState) => state.ui.videoShown;

export const selectPcMenu = (state: RootState) => state.ui.pcMenu;

export const selectPokemonCenterMenu = (state: RootState) =>
  state.ui.pokemonCenterMenu;

export const selectActionOnPokemon = (state: RootState) =>
  state.ui.actionOnPokemon;

export const selectPokeMartMenu = (state: RootState) => state.ui.pokeMartMenu;

export const selectPokedexOpen = (state: RootState) => state.ui.pokedexOpen;

export const selectMenuOpen = (state: RootState) =>
  state.ui.startMenu ||
  state.ui.text !== null ||
  state.ui.itemsMenu ||
  state.ui.playerMenu ||
  state.ui.titleMenu ||
  state.ui.loadMenu ||
  state.ui.gameboyMenu ||
  state.game.pokemonEncounter !== undefined ||
  state.ui.pokemonCenterMenu ||
  state.ui.pcMenu ||
  state.ui.pokeMartMenu ||
  state.ui.pokedexOpen ||
  state.ui.textThenAction !== null ||
  state.ui.learningMove !== null ||
  state.ui.confirmationMenu !== null ||
  state.ui.evolution !== null ||
  state.ui.pokeballCardId !== null ||
  state.ui.academyPokeballOpen ||
  state.ui.onlineBattleMenu ||
  state.ui.mapGiftPending !== null ||
  state.ui.textRewardPending !== null ||
  state.ui.fishing !== null ||
  state.ui.knockback !== null ||
  state.ui.flyMenu ||
  state.ui.flyAnimation !== null;

export const selectStartMenuSubOpen = (state: RootState) =>
  state.ui.itemsMenu || state.ui.playerMenu;

export const selectPokeballThrowing = (state: RootState) =>
  state.ui.pokeballThrowing;

export const selectSpinning = (state: RootState) => state.ui.spinning;

export const selectFrozen = (state: RootState) =>
  selectMenuOpen(state) || state.game.jumping || !!state.game.trainerEncounter;

export const selectTextThenAction = (state: RootState) =>
  state.ui.textThenAction;

export const selectLearningMove = (state: RootState) => state.ui.learningMove;

export const selectBlackScreen = (state: RootState) => state.ui.blackScreen;

export const selectConfirmationMenu = (state: RootState) =>
  state.ui.confirmationMenu;

export const selectEvolution = (state: RootState) => state.ui.evolution;

export const selectPokeballCardId = (state: RootState) =>
  state.ui.pokeballCardId;

export const selectAcademyPokeballOpen = (state: RootState) =>
  state.ui.academyPokeballOpen;

export const selectOnlineBattleMenu = (state: RootState) =>
  state.ui.onlineBattleMenu;

export const selectMapGiftPending = (state: RootState) =>
  state.ui.mapGiftPending;

export const selectTextRewardPending = (state: RootState) =>
  state.ui.textRewardPending;

export const selectFishing = (state: RootState) => state.ui.fishing;

export const selectKnockback = (state: RootState) => state.ui.knockback;

export const selectFlyMenu = (state: RootState) => state.ui.flyMenu;

export const selectFlyAnimation = (state: RootState) => state.ui.flyAnimation;

export const selectPlayerTurnTick = (state: RootState) =>
  state.ui.playerTurnTick;

export const selectPendingConfusionFromItem = (state: RootState) =>
  state.ui.pendingConfusionFromItem;

export const selectOakIntroActive = (state: RootState) => state.ui.oakIntroActive;

export default uiSlice.reducer;
