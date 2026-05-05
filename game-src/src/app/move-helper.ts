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

  // Lower enemy defense
  "leer":          { stat: "defense", target: "defender", delta: -1 },
  "tail-whip":     { stat: "defense", target: "defender", delta: -1 },
  "screech":       { stat: "defense", target: "defender", delta: -2 },
  "sand-attack":   { stat: "defense", target: "defender", delta: -1 },
  "smokescreen":   { stat: "defense", target: "defender", delta: -1 },
  "flash":         { stat: "defense", target: "defender", delta: -1 },
  "kinesis":       { stat: "defense", target: "defender", delta: -1 },

  // Lower enemy speed
  "string-shot":   { stat: "speed",   target: "defender", delta: -2 },
  // Status → speed penalty (sleep/paralysis approximation)
  "sing":          { stat: "speed",   target: "defender", delta: -2 },
  "hypnosis":      { stat: "speed",   target: "defender", delta: -2 },
  "sleep-powder":  { stat: "speed",   target: "defender", delta: -2 },
  "spore":         { stat: "speed",   target: "defender", delta: -2 },
  "lovely-kiss":   { stat: "speed",   target: "defender", delta: -2 },
  "stun-spore":    { stat: "speed",   target: "defender", delta: -2 },
  "thunder-wave":  { stat: "speed",   target: "defender", delta: -2 },
  // Status → special penalty
  "confuse-ray":   { stat: "special", target: "defender", delta: -1 },
  "supersonic":    { stat: "special", target: "defender", delta: -1 },
  "poison-powder": { stat: "special", target: "defender", delta: -1 },
  "toxic":         { stat: "special", target: "defender", delta: -2 },
  "leech-seed":    { stat: "defense", target: "defender", delta: -1 },
  "disable":       { stat: "attack",  target: "defender", delta: -1 },

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
  "double-team":   { stat: "defense", target: "attacker", delta: +1 },
  "minimize":      { stat: "defense", target: "attacker", delta: +2 },

  // Raise own speed
  "agility":       { stat: "speed",   target: "attacker", delta: +2 },

  // Raise own special
  "amnesia":       { stat: "special", target: "attacker", delta: +2 },
  "growth":        { stat: "special", target: "attacker", delta: +1 },
};

// ── Movimientos de efecto especial ──────────────────────────────────────────

/** KO de un golpe — falla además si el defensor tiene mayor nivel (Gen I) */
const OHKO_MOVES = new Set(["guillotine", "horn-drill", "fissure"]);

/** Movimientos de daño fijo (no usan la fórmula de daño estándar) */
const FIXED_DAMAGE_MOVES: Record<string, (level: number) => number> = {
  "seismic-toss": (lv) => lv,         // daño = nivel del atacante (Gen I)
  "night-shade":  (lv) => lv,         // daño = nivel del atacante
  "dragon-rage":  () => 40,           // siempre 40 PS
  "sonic-boom":   () => 20,           // siempre 20 PS
  "counter":      (lv) => lv * 2,     // representa "doble del daño recibido" (aproximado)
  "psywave":      (lv) => Math.max(1, Math.floor(lv * (0.5 + Math.random()))), // aleatorio 0.5–1.5×nivel
};

/** Movimientos de curación — fracción del HP máximo que se restaura */
const HEAL_FRACTION: Record<string, number> = {
  "recover":    0.5,
  "softboiled": 0.5,
  "milk-drink": 0.5,
  "rest":       1.0, // curación total (omitimos el sueño por simplicidad)
};

/** Movimientos sin efecto visible en combate */
const NO_EFFECT_MOVES = new Set(["splash", "teleport", "bide"]);

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
  isTransform?: boolean;
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

  // ── Transformación (copia stats/tipos/movimientos del rival) ─────────────
  if (move === "transform") {
    return { ...defaultReturn, isTransform: true };
  }

  // ── Sin efecto (Splash, Teleport, Bide) ──────────────────────────────────
  if (NO_EFFECT_MOVES.has(move)) {
    return defaultReturn;
  }

  // ── OHKO (Guillotine, Horn Drill, Fissure) ────────────────────────────────
  // En Gen I también falla si el defensor tiene mayor nivel que el atacante
  if (OHKO_MOVES.has(move)) {
    const attackerLevel = isAttacking ? us.level : them.level;
    const defenderLevel = isAttacking ? them.level : us.level;
    if (defenderLevel > attackerLevel) {
      return { ...defaultReturn, missed: true };
    }
    if (isAttacking) {
      return { ...defaultReturn, them: { ...them, hp: 0 } };
    }
    return { ...defaultReturn, us: { ...usAfterPP, hp: 0 } };
  }

  // ── Curación (Recover, Rest) ──────────────────────────────────────────────
  const healFraction = HEAL_FRACTION[move];
  if (healFraction !== undefined) {
    if (isAttacking) {
      const healed = Math.min(ourStats.hp, us.hp + Math.floor(ourStats.hp * healFraction));
      return { ...defaultReturn, isBuff: true, us: { ...usAfterPP, hp: healed } };
    }
    const healed = Math.min(theirStats.hp, them.hp + Math.floor(theirStats.hp * healFraction));
    return { ...defaultReturn, isBuff: true, them: { ...them, hp: healed } };
  }

  // ── Daño fijo (Seismic Toss, Dragon Rage, Sonic Boom, etc.) ──────────────
  const fixedDamageFn = FIXED_DAMAGE_MOVES[move];
  if (fixedDamageFn) {
    const dmg = fixedDamageFn(isAttacking ? us.level : them.level);
    if (isAttacking) {
      return { ...defaultReturn, them: { ...them, hp: Math.max(0, them.hp - dmg) } };
    }
    return { ...defaultReturn, us: { ...usAfterPP, hp: Math.max(0, us.hp - dmg) } };
  }

  // ── Movimientos de estado (sin daño) ─────────────────────────────────────
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
    // Movimiento de estado desconocido — tratar como debuff visual
    return { ...defaultReturn, isDebuff: true };
  }

  // ── Damage moves ──────────────────────────────────────────────────────────
  //
  // Gen I damage formula:
  //   floor( ( floor(2*L/5 + 2) * Power * A/D ) / 50 + 2 ) * STAB * TypeEff * Crit * RND
  //   where RND = floor(rand(217..255)) / 255  (≈ 0.85 – 1.00)
  //
  // CRITICAL HIT in Gen I: ignores all stat stage modifiers (uses base stats).

  // Random factor: uniform integer in [217, 255] → [0.851, 1.0]
  const randFactor = (217 + Math.floor(Math.random() * 39)) / 255;
  const isCrit = Math.random() < CRITICAL_HIT_PERCENTAGE;
  const critMult = isCrit ? CRITICAL_HIT_MULTIPLIER : 1;

  if (isAttacking) {
    // Player attacking enemy
    // If critical hit, ignore stat stages (Gen I behaviour)
    const rawAtk = moveMetadata.damageClass === "physical" ? ourStats.attack    : ourStats.specialAttack;
    const rawDef = moveMetadata.damageClass === "physical" ? theirStats.defense : theirStats.specialDefense;
    const atkStage  = isCrit ? 0 : (moveMetadata.damageClass === "physical" ? myStages.attack    : myStages.special);
    const defStage  = isCrit ? 0 : (moveMetadata.damageClass === "physical" ? theirStages.defense : theirStages.special);
    const attack  = rawAtk * getStageMult(atkStage);
    const defense = rawDef * getStageMult(defStage);

    const stab           = ourMetadata.types.includes(moveMetadata.type) ? 1.5 : 1;
    const typeEff        = getTypeEffectiveness(moveMetadata.type, theirMetadata.types);
    const superEffective  = typeEff > 1;
    const notVeryEffective = typeEff < 1;

    const baseDamage = Math.max(1, Math.floor(
      (Math.floor(((2 * us.level) / 5 + 2) * moveMetadata.power * (attack / defense)) / 50 + 2) *
        stab * typeEff * critMult * randFactor
    ));

    // Movimientos multihit (Double Slap, Fury Attack, Pin Missile, etc.)
    const { minHits, maxHits } = moveMetadata.meta ?? {};
    const hitCount =
      minHits != null && maxHits != null
        ? minHits + Math.floor(Math.random() * (maxHits - minHits + 1))
        : 1;
    const totalDamage = baseDamage * hitCount;

    // Autodestrucción / Explosión: el atacante también se debilita
    const selfDestructs = move === "self-destruct" || move === "explosion";

    return {
      ...defaultReturn,
      them: { ...them, hp: Math.max(0, them.hp - totalDamage) },
      us: selfDestructs ? { ...usAfterPP, hp: 0 } : usAfterPP,
      superEffective,
      notVeryEffective,
      critical: isCrit,
    };
  }

  // Enemy attacking player
  // If critical hit, ignore stat stages (Gen I behaviour)
  const rawAtk = moveMetadata.damageClass === "physical" ? theirStats.attack    : theirStats.specialAttack;
  const rawDef = moveMetadata.damageClass === "physical" ? ourStats.defense     : ourStats.specialDefense;
  const atkStage  = isCrit ? 0 : (moveMetadata.damageClass === "physical" ? theirStages.attack    : theirStages.special);
  const defStage  = isCrit ? 0 : (moveMetadata.damageClass === "physical" ? myStages.defense      : myStages.special);
  const attack  = rawAtk * getStageMult(atkStage);
  const defense = rawDef * getStageMult(defStage);

  const stab           = theirMetadata.types.includes(moveMetadata.type) ? 1.5 : 1;
  const typeEff        = getTypeEffectiveness(moveMetadata.type, ourMetadata.types);
  const superEffective  = typeEff > 1;
  const notVeryEffective = typeEff < 1;

  const baseDmg = Math.max(1, Math.floor(
    (Math.floor(((2 * them.level) / 5 + 2) * moveMetadata.power * (attack / defense)) / 50 + 2) *
      stab * typeEff * critMult * randFactor
  ));

  // Movimientos multihit (Double Slap, Fury Attack, Pin Missile, etc.)
  const { minHits: eMin, maxHits: eMax } = moveMetadata.meta ?? {};
  const eHits =
    eMin != null && eMax != null
      ? eMin + Math.floor(Math.random() * (eMax - eMin + 1))
      : 1;
  const eTotalDmg = baseDmg * eHits;

  // Autodestrucción / Explosión: el atacante (enemigo) también se debilita
  const enemyExplodes = move === "self-destruct" || move === "explosion";

  return {
    ...defaultReturn,
    us: { ...usAfterPP, hp: Math.max(0, us.hp - eTotalDmg) },
    them: enemyExplodes ? { ...them, hp: 0 } : them,
    superEffective,
    notVeryEffective,
    critical: isCrit,
  };
};

export default processMove;
