import mapData from "../maps/map-data";
import { MapId, MapItemType, SimpleGiftType, StaticPokemonType, TrainerType } from "../maps/map-types";
import { Direction, PosType } from "../state/state-types";
import { TRAINER_VISION } from "./constants";

export const isWall = (
  walls: Record<number, number[]>,
  x: number,
  y: number
): boolean => {
  return walls[y] && walls[y].includes(x);
};

export const isFence = (
  fences: Record<number, number[]> | undefined,
  x: number,
  y: number
): boolean => {
  return !!fences && fences[y] && fences[y].includes(x);
};

export const isGrass = (
  grass: Record<number, number[]> | undefined,
  x: number,
  y: number
): boolean => {
  return !!grass && grass[y] && grass[y].includes(x);
};

export const isWater = (
  water: Record<number, number[]> | undefined,
  x: number,
  y: number
): boolean => {
  return !!water && water[y] && water[y].includes(x);
};

export const isExit = (
  exits: Record<number, number[]> | undefined,
  x: number,
  y: number
): boolean => {
  return !!exits && exits[y] && exits[y].includes(x);
};

export const isTrainer = (
  trainers: TrainerType[] | undefined,
  x: number,
  y: number
): boolean => {
  return (
    !!trainers &&
    trainers.some((trainer) => trainer.pos.x === x && trainer.pos.y === y)
  );
};

export const isItem = (
  items: MapItemType[] | undefined,
  x: number,
  y: number,
  collectedItems: string[],
  mapId: string
): boolean => {
  return (
    !!items &&
    items.some((item) => {
      const id = `${mapId}-${item.pos.x}-${item.pos.y}`;
      const isPosition = item.pos.x === x && item.pos.y === y;
      return isPosition && !collectedItems.includes(id);
    })
  );
};

// Pokéballs-regalo declarativas. Bloquean el paso mientras no se haya
// completado la quest asociada (es decir, mientras el regalo no se haya
// recogido). El estado vive en `completedQuests` (no en `collectedItems`).
export const isGift = (
  gifts: SimpleGiftType[] | undefined,
  x: number,
  y: number,
  completedQuests: string[]
): boolean => {
  return (
    !!gifts &&
    gifts.some(
      (gift) =>
        gift.pos.x === x &&
        gift.pos.y === y &&
        !completedQuests.includes(gift.questId)
    )
  );
};

export const isStaticPokemon = (
  staticPokemon: StaticPokemonType[] | undefined,
  x: number,
  y: number,
  completedQuests: string[]
): boolean => {
  return (
    !!staticPokemon &&
    staticPokemon.some(
      (sp) =>
        sp.pos.x === x &&
        sp.pos.y === y &&
        !completedQuests.includes(sp.questId)
    )
  );
};

export const canWalk = (
  x: number,
  y: number,
  mapId: MapId,
  collectedItems: string[],
  defeatedTrainers: string[] = [],
  completedQuests: string[] = [],
  hasPokemon: boolean = false
) => {
  const map = mapData[mapId];
  if (isItem(map.items, x, y, collectedItems, mapId)) return false;
  if (isGift(map.gifts, x, y, completedQuests)) return false;
  if (isWall(map.walls, x, y)) return false;
  if (isWater(map.water, x, y)) return false;
  if (isFence(map.fences, x, y)) return false;
  // Un trainer bloquea el paso siempre, como un muro.
  // La única excepción es hideCondition activa (trainer invisible).
  const blockingTrainers = (map.trainers ?? []).filter((t) => {
    if (t.hideCondition === "has-pokemon" && hasPokemon) return false;
    return true;
  });
  if (isTrainer(blockingTrainers, x, y)) return false;
  if (isStaticPokemon(map.staticPokemon, x, y, completedQuests)) return false;
  return true;
};

export const directionModifier = (direction: Direction): PosType => {
  if (direction === Direction.Down) return { x: 0, y: 1 };
  if (direction === Direction.Up) return { x: 0, y: -1 };
  if (direction === Direction.Left) return { x: -1, y: 0 };
  if (direction === Direction.Right) return { x: 1, y: 0 };
  throw new Error("Invalid direction");
};

const isEncounter = (
  trainer: TrainerType,
  walls: Record<number, number[]>,
  fences: Record<number, number[]> | undefined,
  trainers: TrainerType[],
  pos: PosType,
  defeatedTrainers: string[],
  mapId: MapId
): boolean => {
  const trainerId = `${mapId}-${trainer.pos.x}-${trainer.pos.y}`;
  if (defeatedTrainers.includes(trainerId)) return false;

  let { x: tX, y: tY } = trainer.pos;
  let { x: pX, y: pY } = pos;

  const direction = directionModifier(trainer.facing);
  // sightRange: por NPC, override del valor global. 0 = nunca dispara por
  // proximidad (solo al hablar). undefined = usa TRAINER_VISION.
  const range = trainer.sightRange ?? TRAINER_VISION;
  if (range <= 0) return false;
  for (let i = 1; i < range; i++) {
    tX += direction.x;
    tY += direction.y;

    if (tX === pX && tY === pY) return true;
    if (isWall(walls, tX, tY)) return false;
    if (isFence(fences, tX, tY)) return false;
    if (isTrainer(trainers, pos.x, pos.y)) return false;
  }
  return false;
};

export const isTrainerEncounter = (
  trainers: TrainerType[],
  walls: Record<number, number[]>,
  fences: Record<number, number[]> | undefined,
  pos: PosType,
  defeatedTrainers: string[],
  mapId: MapId
): TrainerType | null => {
  for (let i = 0; i < trainers.length; i++) {
    if (
      isEncounter(
        trainers[i],
        walls,
        fences,
        trainers,
        pos,
        defeatedTrainers,
        mapId
      )
    )
      return trainers[i];
  }
  return null;
};
