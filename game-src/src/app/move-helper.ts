import { PokemonEncounterType, PokemonInstance } from "../state/state-types";
import { CRITICAL_HIT_MULTIPLIER, CRITICAL_HIT_PERCENTAGE } from "./constants";
import getTypeEffectiveness from "./type-effectiveness";
import { getMoveMetadata } from "./use-move-metadata";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

// ── Stat stages (Gen I) ──────────────────────────────────────────────────────

export interface StatStages {
  attack: number;    // -6 to +6
  defense: number;
  speed: number;
  special: number;   // Gen I: single special stat covers both sp.atk and sp.def
}

export const DEFAULT_STAGES: StatStages = {
  attack: 0,
  defense: 0,
  speed: 0,
  special: 0,
};

// Gen I stage multipliers — index = stage + 6  (stage -6 → idx 0, stage 0 → idx 6)
const STAGE_MULT = [1 / 4, 2 / 7, 1 / 3, 2 / 5, 1 / 2, 2 / 3, 1, 3 / 2, 2, 5 / 2, 3, 7 / 2, 4];

export const getStageMult = (stage: number): number =>
  STAGE_MULT[Math.max(-6, Math.min(6, Math.round(stage))) + 6];

// ── Status move table ────────────────────────────────────────────────────────
// target: 'attacker' = the pokemon using this move
//         'defender' = the one being targeted

export interface StatChange {
  stat: keyof StatStages;
  target: "attacker" | "defender";
  delta: number;
}

const STATUS_MOVE_EFFECTS: Record<string, StatChange> = {
  // Lower enemy attack
  "growl":         { stat: "attack",  target: "defender", delta: -1 },
  "confuse-ray":   { stat: "attack",  target: "defender", delta: -1 },

  // Lower enemy defense
  "leer":          { stat: "defense", target: "defender", delta: -1 },
  "tail-whip":     { stat: "defense", target: "defender", delta: -1 },
  "screech":       { stat: "defense", target: "defender", delta: -2 },
  "sand-attack":   { stat: "defense", target: "defender", delta: -1 }, // simplified from accuracy
  "smokescreen":   { stat: "defense", target: "defender", delta: -1 }, // simplified from accuracy
  "flash":         { stat: "defense", target: "defender", delta: -1 }, // simplified from accuracy
  "kinesis":       { stat: "defense", target: "defender", delta: -1 }, // simplified from accuracy

  // Lower enemy speed
  "string-shot":   { stat: "speed",   target: "defender", delta: -2 },

  // Raise own attack
  "sharpen":       { stat: "attack",  target: "attacker", delta: +1 },
  "meditate":      { stat: "attack",  target: "attacker", delta: +1 },
  "swords-dance":  { stat: "attack",  target: "attacker", delta: +2 },
  "focus-energy":  { stat: "attack",  target: "attacker", delta: +1 },

  // Raise own defense
  "harden":        { stat: "defense", target: "attacker", delta: +1 },
  "withdraw":      { stat: "defense", target: "attacker", delta: +1 },
  "defense-curl":  { stat: "defense", target: "attacker", delta: +1 },
  "acid-armor":    { stat: "defense", target: "attacker", delta: +2 },
  "barrier":       { stat: "defense", target: "attacker", delta: +2 },
  "double-team":   { stat: "defense", target: "attacker", delta: +1 }, // simplified from evasion
  "minimize":      { stat: "defense", target: "attacker", delta: +2 }, // simplified from evasion

  // Raise own speed
  "agility":       { stat: "speed",   target: "attacker", delta: +2 },

  // Raise own special
  "amnesia":       { stat: "special", target: "attacker", delta: +2 },
  "growth":        { stat: "special", target: "attacker", delta: +1 },
};

// ── MoveResult ───────────────────────────────────────────────────────────────

export interface MoveResult {
  moveName: string;
  us: PokemonInstance;
  them: PokemonEncounterType;
  missed: boolean;
  superEffective: boolean;
  notVeryEffective: boolean;
  critical: boolean;
  isBuff: boolean;
  isDebuff: boolean;
  statChange?: StatChange; // present for status moves with a known effect
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const reducePP = (us: PokemonInstance, move: string): PokemonInstance => ({
  ...us,
  moves: us.moves.map((m) =>
    m.id !== move ? m : { ...m, pp: Math.max(0, m.pp - 1) }
  ),
});

// ── Main export ──────────────────────────────────────────────────────────────

const processMove = (
  us: PokemonInstance,
  them: PokemonEncounterType,
  move: string,
  isAttacking: boolean,
  stages?: { us: StatStages; them: StatStages }
): MoveResult => {
  const ourMetadata  = getPokemonMetadata(us.id);
  const theirMetadata = getPokemonMetadata(them.id);
  const ourStats    = getPokemonStats(us.id,   us.level);
  const theirStats  = getPokemonStats(them.id, them.level);
  const moveMetadata = getMoveMetadata(move);

  const myStages    = stages?.us   ?? DEFAULT_STAGES;
  const theirStages = stages?.them ?? DEFAULT_STAGES;

  const usAfterPP = isAttacking ? reducePP(us, move) : us;

  const defaultReturn: MoveResult = {
    moveName: moveMetadata.name,
    us: usAfterPP,
    them,
    missed: false,
    superEffective: false,
    notVeryEffective: false,
    critical: false,
    isBuff: false,
    isDebuff: false,
  };

  // ── Accuracy check ────────────────────────────────────────────────────────
  if (moveMetadata.accuracy && moveMetadata.accuracy < Math.random() * 100) {
    return { ...defaultReturn, missed: true };
  }

  // ── Status moves (no power) ───────────────────────────────────────────────
  if (!moveMetadata.power) {
    const effect = STATUS_MOVE_EFFECTS[move];
    if (effect) {
      return {
        ...defaultReturn,
        isBuff:    effect.delta > 0,
        isDebuff:  effect.delta < 0,
        statChange: effect,
      };
    }
    // Unknown status move — treat as debuff with no extra effect
    return { ...defaultReturn, isDebuff: true };
  }

  // ── Damage moves ──────────────────────────────────────────────────────────
  const critical = Math.random() < CRITICAL_HIT_PERCENTAGE ? CRITICAL_HIT_MULTIPLIER : 1;

  if (isAttacking) {
    // Player attacking enemy
    const rawAtk = moveMetadata.damageClass === "physical" ? ourStats.attack    : ourStats.specialAttack;
    const rawDef = moveMetadata.damageClass === "physical" ? theirStats.defense : theirStats.specialDefense;
    const atkStage  = moveMetadata.damageClass === "physical" ? myStages.attack    : myStages.special;
    const defStage  = moveMetadata.damageClass === "physical" ? theirStages.defense : theirStages.special;
    const attack  = rawAtk * getStageMult(atkStage);
    const defense = rawDef * getStageMult(defStage);

    const stab           = ourMetadata.types.includes(moveMetadata.type) ? 1.5 : 1;
    const typeEff        = getTypeEffectiveness(moveMetadata.type, theirMetadata.types);
    const superEffective  = typeEff > 1;
    const notVeryEffective = typeEff < 1;

    const damage = Math.round(
      ((((2 * us.level * critical) / 5 + 2) * moveMetadata.power * (attack / defense)) / 50 + 2) *
        stab * typeEff
    );

    return {
      ...defaultReturn,
      them: { ...them, hp: Math.max(0, them.hp - damage) },
      superEffective,
      notVeryEffective,
      critical: critical > 1,
    };
  }

  // Enemy attacking player
  const rawAtk = moveMetadata.damageClass === "physical" ? theirStats.attack    : theirStats.specialAttack;
  const rawDef = moveMetadata.damageClass === "physical" ? ourStats.defense     : ourStats.specialDefense;
  const atkStage  = moveMetadata.damageClass === "physical" ? theirStages.attack    : theirStages.special;
  const defStage  = moveMetadata.damageClass === "physical" ? myStages.defense      : myStages.special;
  const attack  = rawAtk * getStageMult(atkStage);
  const defense = rawDef * getStageMult(defStage);

  const stab           = theirMetadata.types.includes(moveMetadata.type) ? 1.5 : 1;
  const typeEff        = getTypeEffectiveness(moveMetadata.type, ourMetadata.types);
  const superEffective  = typeEff > 1;
  const notVeryEffective = typeEff < 1;

  const damage = Math.round(
    ((((2 * them.level * critical) / 5 + 2) * moveMetadata.power * (attack / defense)) / 50 + 2) *
      stab * typeEff
  );

  return {
    ...defaultReturn,
    us: { ...usAfterPP, hp: Math.max(0, us.hp - damage) },
    superEffective,
    notVeryEffective,
    critical: critical > 1,
  };
};

export default processMove;
