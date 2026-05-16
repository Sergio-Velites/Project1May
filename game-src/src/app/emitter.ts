import mitt from "mitt";

export enum Event {
  Up = "up",
  StartUp = "start-up",
  StopUp = "stop-up",
  Down = "down",
  StartDown = "start-down",
  StopDown = "stop-down",
  Left = "left",
  StartLeft = "start-left",
  StopLeft = "stop-left",
  Right = "right",
  StartRight = "start-right",
  StopRight = "stop-right",
  A = "a",
  B = "b",
  Start = "start",
  Select = "select",
  StopMoving = "stop-moving",
  EnterDoor = "enter-door",
  HealPokemon = "heal-pokemon",
  LevelUp = "level-up",
  VictoryTrainer = "victory-trainer",
  VictoryWild = "victory-wild",
  VictoryGym = "victory-gym",
  TrainerAppears = "trainer-appears",
  Evolution = "evolution",
  EvolutionEnd = "evolution-end",
  PokemonCaught = "pokemon-caught",
  PokemonObtained = "pokemon-obtained",
}

const emitter = mitt();

export default emitter;
