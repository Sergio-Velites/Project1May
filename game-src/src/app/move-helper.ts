import { PokemonEncounterType, PokemonInstance } from "../state/state-types";
import { CRITICAL_HIT_MULTIPLIER, CRITICAL_HIT_PERCENTAGE } from "./constants";
import moveMetadataAll from "./move-metadata";
import getTypeEffectiveness from "./type-effectiveness";
import { getMoveMetadata } from "./use-move-metadata";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";

// ── Multi-hit distribution (Gen I) ─────────────────────────────────────────
// Double Slap, Fury Attack, Pin Missile, Barrage, Spike Cannon, Bone Rush:
// 37.5% → 2 golpes · 37.5% → 3 · 12.5% → 4 · 12.5% → 5
// Movimientos de golpes fijos (Twineedle, Double Kick): min === max → siempre ese número
const genIMultiHitCount = (min: number, max: number): number => {
  if (min === max) return min; // Golpes fijos: Twineedle (2), Double Kick (2)
  if (min === 2 && max === 5) {
    const r = Math.random();
    if (r < 0.375) return 2;
    if (r < 0.750) return 3;
    if (r < 0.875) return 4;
    return 5;
  }
  // Fallback uniforme para cualquier otro rango
  return min + Math.floor(Math.random() * (max - min + 1));
};

// ── Stat stages (Gen I) ──────────────────────────────────────────────────────

export interface StatStages {
  attack: number;    // -6 to +6
  defense: number;
  speed: number;
  special: number;   // Gen I: single special stat covers both sp.atk and sp.def
  accuracy: number;  // -6 to +6
  evasion: number;   // -6 to +6
}

export const DEFAULT_STAGES: StatStages = {
  attack: 0,
  defense: 0,
  speed: 0,
  special: 0,
  accuracy: 0,
  evasion: 0,
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

const STATUS_MOVE_EFFECTS: Record<string, StatChange | StatChange[]> = {
  // Lower enemy attack
  "growl":         { stat: "attack",  target: "defender", delta: -1 },

  // Lower enemy defense
  "leer":          { stat: "defense", target: "defender", delta: -1 },
  "tail-whip":     { stat: "defense", target: "defender", delta: -1 },
  "screech":       { stat: "defense", target: "defender", delta: -2 },

  // Lower enemy accuracy (Gen I correcto)
  "sand-attack":   { stat: "accuracy", target: "defender", delta: -1 },
  "smokescreen":   { stat: "accuracy", target: "defender", delta: -1 },
  "flash":         { stat: "accuracy", target: "defender", delta: -1 },
  "kinesis":       { stat: "accuracy", target: "defender", delta: -1 },

  // Lower enemy speed
  "string-shot":   { stat: "speed",   target: "defender", delta: -2 },
  // disable: en Gen I bloquea 1 movimiento aleatorio; gestionado en PokemonEncounter

  // Raise own attack
  "sharpen":       { stat: "attack",  target: "attacker", delta: +1 },
  "meditate":      { stat: "attack",  target: "attacker", delta: +1 },
  "swords-dance":  { stat: "attack",  target: "attacker", delta: +2 },
  // focus-energy: bug Gen I — reduce crits a ÷4 en lugar de ×4; implementado como no-op

  // Raise own defense
  "harden":        { stat: "defense", target: "attacker", delta: +1 },
  "withdraw":      { stat: "defense", target: "attacker", delta: +1 },
  "defense-curl":  { stat: "defense", target: "attacker", delta: +1 },
  "acid-armor":    { stat: "defense", target: "attacker", delta: +2 },
  "barrier":       { stat: "defense", target: "attacker", delta: +2 },

  // Raise own evasion (Gen I correcto)
  "double-team":   { stat: "evasion", target: "attacker", delta: +1 },
  "minimize":      { stat: "evasion", target: "attacker", delta: +2 },

  // Raise own speed
  "agility":       { stat: "speed",   target: "attacker", delta: +2 },

  // Raise own special
  "amnesia":       { stat: "special", target: "attacker", delta: +2 },
  "growth":        { stat: "special", target: "attacker", delta: +1 },

  // Multi-stat buffs
  "dragon-dance":  [
    { stat: "attack", target: "attacker", delta: +1 },
    { stat: "speed",  target: "attacker", delta: +1 },
  ],
};

// ── Condiciones de estado ────────────────────────────────────────────────────

export type StatusType =
  | "poison"
  | "badly-poisoned"
  | "burn"
  | "paralysis"
  | "sleep"
  | "freeze"
  | "leech-seed";  // leech-seed es un estado especial que drena HP cada turno

export interface StatusApply {
  status: StatusType;
  target: "attacker" | "defender";
  force?: boolean;      // si true, sobreescribe estado existente (Rest)
  fixedTurns?: number;  // si se indica, usa este número en lugar del aleatorio
}

/** Movimientos que aplican una condición de estado como efecto principal o secundario */
const STATUS_APPLY_TABLE: Record<string, StatusApply> = {
  // ── Estado puro (probabilidad gestionada por accuracy del movimiento) ──
  "poison-powder": { status: "poison",         target: "defender" },
  "toxic":         { status: "badly-poisoned",  target: "defender" },
  "leech-seed":    { status: "leech-seed",      target: "defender" },
  "stun-spore":    { status: "paralysis",       target: "defender" },
  "thunder-wave":  { status: "paralysis",       target: "defender" },
  "sleep-powder":  { status: "sleep",           target: "defender" },
  "spore":         { status: "sleep",           target: "defender" },
  "sing":          { status: "sleep",           target: "defender" },
  "hypnosis":      { status: "sleep",           target: "defender" },
  "lovely-kiss":   { status: "sleep",           target: "defender" },
  // ── Efectos secundarios de movimientos de daño (chance separada abajo) ──
  "poison-sting":  { status: "poison",    target: "defender" },
  "sludge":        { status: "poison",    target: "defender" },
  "smog":          { status: "poison",    target: "defender" },
  "twineedle":     { status: "poison",    target: "defender" },
  "ember":         { status: "burn",      target: "defender" },
  "flamethrower":  { status: "burn",      target: "defender" },
  "fire-blast":    { status: "burn",      target: "defender" },
  "fire-punch":    { status: "burn",      target: "defender" },
  "body-slam":     { status: "paralysis", target: "defender" },
  "lick":          { status: "paralysis", target: "defender" },
  "thunder":       { status: "paralysis", target: "defender" },
  "thunderbolt":   { status: "paralysis", target: "defender" },
  "thunder-punch": { status: "paralysis", target: "defender" },
  "blizzard":      { status: "freeze",    target: "defender" },
  "ice-beam":      { status: "freeze",    target: "defender" },
  "ice-punch":     { status: "freeze",    target: "defender" },
};

/** Probabilidad del efecto secundario de estado para movimientos de daño */
const SECONDARY_STATUS_CHANCE: Record<string, number> = {
  "poison-sting":  0.30,
  "sludge":        0.30,
  "smog":          0.40,
  "twineedle":     0.20,
  "ember":         0.10,
  "flamethrower":  0.10,
  "fire-blast":    0.30,
  "fire-punch":    0.10,
  "body-slam":     0.30,
  "lick":          0.30,
  "thunder":       0.10,
  "thunderbolt":   0.10,
  "thunder-punch": 0.10,
  "blizzard":      0.10,
  "ice-beam":      0.10,
  "ice-punch":     0.10,
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
  "psywave":      (lv) => Math.max(1, Math.floor(lv * (0.5 + Math.random()))), // aleatorio 0.5–1.5×nivel
};
// counter y super-fang se manejan aparte (necesitan HP/daño recibido actual)

/** Movimientos de curación — fracción del HP máximo que se restaura */
const HEAL_FRACTION: Record<string, number> = {
  "recover":    0.5,
  "softboiled": 0.5,
  "milk-drink": 0.5,
  // rest se maneja como caso especial (cura + aplica sueño 2 turnos)
};

/** Movimientos sin efecto visible en combate */
const NO_EFFECT_MOVES = new Set(["splash", "teleport", "focus-energy"]);

/** Movimientos que causan confusión (estado volátil real — gestionado en PokemonEncounter) */
export const CONFUSE_MOVES = new Set(["confuse-ray", "supersonic"]);

/** Movimientos de carga de 2 turnos — T1: cargar, T2: atacar (gestionado en PokemonEncounter) */
export const CHARGE_MOVES = new Set(["solar-beam", "razor-wind", "sky-attack", "skull-bash"]);

/** Movimientos de invulnerabilidad de 2 turnos — T1: desaparecer, T2: atacar */
export const INVULNERABLE_MOVES = new Set(["dig", "fly"]);

/** Mensaje de carga por movimiento */
export const CHARGE_MESSAGE: Record<string, string> = {
  "solar-beam":  "¡{user} absorbió la luz solar!",
  "razor-wind":  "¡{user} generó un corte de viento!",
  "sky-attack":  "¡{user} está concentrándose!",
  "skull-bash":  "¡{user} agachó la cabeza!",
  "dig":         "¡{user} se hundió bajo tierra!",
  "fly":         "¡{user} voló hacia el cielo!",
};

export const isChargeMove = (moveId: string) => CHARGE_MOVES.has(moveId);
export const isInvulnerableMove = (moveId: string) => INVULNERABLE_MOVES.has(moveId);

/**
 * Devuelve `true` si el movimiento es un cambio de stat que afecta al
 * propio usuario (self-targeting), no al rival. Necesario para que la
 * animación de combate se muestre en el lado correcto.
 */
export const isSelfTargetingStatusMove = (moveId: string): boolean => {
  const effect = STATUS_MOVE_EFFECTS[moveId];
  if (!effect) return false;
  const first = Array.isArray(effect) ? effect[0] : effect;
  return first.target === "attacker";
};

// ── MoveResult ───────────────────────────────────────────────────────────────

/** Contexto extra necesario para algunos movimientos especiales */
export interface MoveContext {
  /** Último daño físico recibido por el jugador (para Counter) */
  lastPhysicalDamageTaken: number;
  /** ¿El objetivo está dormido? (para Dream Eater) */
  isTargetSleeping: boolean;
}

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
  statChange?: StatChange | StatChange[];  // single or multi-stat change
  statusApply?: StatusApply;  // present when a status condition is applied
  drainHeal?: number;         // >0: usuario cura X PS; <0: recoil (pierde X PS)
  flinch?: boolean;           // true: el objetivo no puede actuar ese turno
  // ── Nuevos efectos ──────────────────────────────────────────
  confuse?: boolean;          // true: el objetivo queda confundido
  isHaze?: boolean;           // true: resetear todos los stages
  isMist?: boolean;           // true: activar Velo en el usuario
  fieldEffect?: "reflect" | "light-screen"; // activa pantalla de campo
  isConversion?: boolean;     // true: cambiar tipo al de uno de los moves
  isBide?: boolean;           // true: el usuario entra en modo Bide
  isDisable?: boolean;        // true: inhabilitar último move del rival
  requiresRecharge?: boolean; // true: el atacante pierde el siguiente turno (Hiperrayo)
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
  stages?: { us: StatStages; them: StatStages },
  context?: MoveContext
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

  // ── Accuracy check (incluyendo stages de precisión/evasion) ──────────────────
  if (moveMetadata.accuracy) {
    // El atacante usa su accuracy stage; el defensor su evasion stage
    const attAccStage  = isAttacking ? myStages.accuracy  : theirStages.accuracy;
    const defEvaStage  = isAttacking ? theirStages.evasion : myStages.evasion;
    const effectiveAcc = moveMetadata.accuracy * getStageMult(attAccStage) / getStageMult(defEvaStage);
    if (effectiveAcc < Math.random() * 100) {
      return { ...defaultReturn, missed: true };
    }
  }

  // ── Transformación (copia stats/tipos/movimientos del rival) ─────────────
  if (move === "transform") {
    return { ...defaultReturn, isTransform: true };
  }
  // ── Metrónomo — elige y ejecuta un movimiento aleatorio ───────────────────
  if (move === "metronome") {
    const excluded = new Set(["metronome", "struggle", "transform"]);
    const allMoveIds = Object.keys(moveMetadataAll).filter((id) => !excluded.has(id));
    const randomMove = allMoveIds[Math.floor(Math.random() * allMoveIds.length)];
    // Cambiar el moveName del resultado para mostrar el movimiento elegido
    const innerResult = processMove(us, them, randomMove, isAttacking, stages, context);
    return { ...innerResult, moveName: `Metrónomo (→ ${innerResult.moveName})` };
  }

  // ── Counter — devuelve 2× el último daño físico recibido ────────────────
  if (move === "counter") {
    const dmg = Math.max(1, (context?.lastPhysicalDamageTaken ?? 0) * 2);
    if (isAttacking) {
      return { ...defaultReturn, them: { ...them, hp: Math.max(0, them.hp - dmg) } };
    }
    return { ...defaultReturn, us: { ...usAfterPP, hp: Math.max(0, us.hp - dmg) } };
  }

  // ── Super Fang — reduce a la mitad el HP actual del objetivo ─────────────
  if (move === "super-fang") {
    if (isAttacking) {
      const dmg = Math.max(1, Math.floor(them.hp / 2));
      return { ...defaultReturn, them: { ...them, hp: Math.max(0, them.hp - dmg) } };
    }
    const dmg = Math.max(1, Math.floor(us.hp / 2));
    return { ...defaultReturn, us: { ...usAfterPP, hp: Math.max(0, us.hp - dmg) } };
  }
  // ── Sin efecto (Splash, Teleport) ──────────────────────────────────────
  if (NO_EFFECT_MOVES.has(move)) {
    return defaultReturn;
  }

  // ── Confusión (estado volátil — procesado en PokemonEncounter) ──────────
  if (CONFUSE_MOVES.has(move)) {
    return { ...defaultReturn, isDebuff: true, confuse: true };
  }

  // ── Reflect / Light Screen ───────────────────────────────────────────────
  if (move === "reflect") {
    return { ...defaultReturn, isBuff: true, fieldEffect: "reflect" };
  }
  if (move === "light-screen") {
    return { ...defaultReturn, isBuff: true, fieldEffect: "light-screen" };
  }

  // ── Haze — resetear todos los stages ────────────────────────────────────
  if (move === "haze") {
    return { ...defaultReturn, isDebuff: true, isHaze: true };
  }

  // ── Mist — proteger contra cambios de stats del rival ───────────────────
  if (move === "mist") {
    return { ...defaultReturn, isBuff: true, isMist: true };
  }

  // ── Conversion — cambiar tipo al de uno de los moves del usuario ─────────
  if (move === "conversion") {
    return { ...defaultReturn, isBuff: true, isConversion: true };
  }

  // ── Bide — acumular daño y liberarlo al tercer turno ────────────────────
  if (move === "bide") {
    return { ...defaultReturn, isBide: true };
  }

  // ── Disable — inhabilitar el último move usado por el rival ─────────────
  if (move === "disable") {
    return { ...defaultReturn, isDebuff: true, isDisable: true };
  }

  // ── Movimientos de 2 turnos (Solar Beam, Razor Wind, Sky Attack, Skull Bash)
  // y de invulnerabilidad (Dig, Fly) — el componente gestiona el 2º turno.
  // En el 1º turno no hacen daño; el componente los intercepta antes de llegar aquí.
  // Si llegan aquí es porque es el 2º turno → ejecutar normalmente como daño estándar.

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

  // ── Rest: cura HP completo + aplica sueño 2 turnos (Gen I) ─────────────────
  if (move === "rest") {
    // target: "attacker" → cuando isAttacking=true afecta al jugador, cuando false afecta al rival
    const sleepApply: StatusApply = { status: "sleep", target: "attacker", force: true, fixedTurns: 2 };
    if (isAttacking) {
      return { ...defaultReturn, isBuff: true, us: { ...usAfterPP, hp: ourStats.hp }, statusApply: sleepApply };
    }
    return { ...defaultReturn, isBuff: true, them: { ...them, hp: theirStats.hp }, statusApply: sleepApply };
  }

  // ── Curación (Recover, Softboiled, Milk Drink) ───────────────────────────
  const healFraction = HEAL_FRACTION[move];
  if (healFraction !== undefined) {
    if (isAttacking) {
      const healed = Math.min(ourStats.hp, us.hp + Math.floor(ourStats.hp * healFraction));
      return { ...defaultReturn, isBuff: true, us: { ...usAfterPP, hp: healed } };
    }
    const healed = Math.min(theirStats.hp, them.hp + Math.floor(theirStats.hp * healFraction));
    return { ...defaultReturn, isBuff: true, them: { ...them, hp: healed } };
  }

  // ── Dream Eater — solo funciona contra objetivos dormidos ────────────────
  if (move === "dream-eater") {
    if (!context?.isTargetSleeping) {
      return { ...defaultReturn, missed: true };
    }
    // Funciona como movimiento de daño especial con drain:50 (cae a la sección de daño)
  }

  // ── Daño fijo (Seismic Toss, Dragon Rage, Sonic Boom, etc.) ────────────
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
    // Condición de estado real (sueño, parálisis, veneno…)
    const statusEntry = STATUS_APPLY_TABLE[move];
    if (statusEntry) {
      return {
        ...defaultReturn,
        isDebuff: statusEntry.target === "defender",
        isBuff:   statusEntry.target === "attacker",
        statusApply: statusEntry,
      };
    }
    // Cambio de estadística (growl, leer, swords-dance…)
    const effect = STATUS_MOVE_EFFECTS[move];
    if (effect) {
      const isArr = Array.isArray(effect);
      const firstDelta = isArr ? effect[0].delta : (effect as StatChange).delta;
      return {
        ...defaultReturn,
        isBuff:    firstDelta > 0,
        isDebuff:  firstDelta < 0,
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
  // Gen I: movimientos con critRate:1 tienen 8× más probabilidad de crítico
  const highCrit = moveMetadata.meta?.critRate === 1;
  const critChance = highCrit
    ? Math.min(0.5, CRITICAL_HIT_PERCENTAGE * 8)
    : CRITICAL_HIT_PERCENTAGE;
  const isCrit = Math.random() < critChance;
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
        ? genIMultiHitCount(minHits, maxHits)
        : 1;
    // Twineedle: tirar veneno independientemente por cada golpe
    const twineedlePoison =
      move === "twineedle" && hitCount > 0
        ? Array.from({ length: hitCount }).some(() => Math.random() < 0.20)
        : false;
    const totalDamage = baseDamage * hitCount;

    // Autodestrucción / Explosión: el atacante también se debilita
    const selfDestructs = move === "self-destruct" || move === "explosion";

    // Efecto secundario de estado (body-slam, thunderbolt, flamethrower…)
    const secEntry = STATUS_APPLY_TABLE[move];
    const secChance = SECONDARY_STATUS_CHANCE[move];
    const secondaryStatus: StatusApply | undefined =
      move === "twineedle"
        ? (twineedlePoison ? { status: "poison" as const, target: "defender" as const } : undefined)
        : secEntry && secChance && Math.random() < secChance ? secEntry : undefined;

    // Drain / recoil (meta.drain: 50 = cura 50% daño; -25 = recoil 25% daño)
    const drainPct = moveMetadata.meta?.drain ?? 0;
    const drainHpDelta = drainPct !== 0
      ? Math.max(1, Math.floor(totalDamage * Math.abs(drainPct) / 100)) * (drainPct > 0 ? 1 : -1)
      : undefined;

    // Flinch: el objetivo no puede actuar este turno
    const flinchChance = (moveMetadata.meta?.flinchChance ?? 0) / 100;
    const flinch = flinchChance > 0 && Math.random() < flinchChance ? true : undefined;

    const newUsHp = selfDestructs ? 0
      : drainHpDelta !== undefined
        ? Math.min(ourStats.hp, Math.max(0, usAfterPP.hp + drainHpDelta))
        : usAfterPP.hp;

    return {
      ...defaultReturn,
      them: { ...them, hp: Math.max(0, them.hp - totalDamage) },
      us: { ...usAfterPP, hp: newUsHp },
      superEffective,
      notVeryEffective,
      critical: isCrit,
      statusApply: secondaryStatus,
      drainHeal: drainHpDelta,
      flinch,
      requiresRecharge: move === "hyper-beam" ? true : undefined,
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
      ? genIMultiHitCount(eMin, eMax)
      : 1;
  // Twineedle del rival: veneno por golpe
  const eTwineedlePoison =
    move === "twineedle" && eHits > 0
      ? Array.from({ length: eHits }).some(() => Math.random() < 0.20)
      : false;
  const eTotalDmg = baseDmg * eHits;

  // Autodestrucción / Explosión: el atacante (enemigo) también se debilita
  const enemyExplodes = move === "self-destruct" || move === "explosion";

  // Efecto secundario de estado cuando el enemigo ataca
  const eSecEntry = STATUS_APPLY_TABLE[move];
  const eSecChance = SECONDARY_STATUS_CHANCE[move];
  const eSecondaryStatus: StatusApply | undefined =
    move === "twineedle"
      ? (eTwineedlePoison ? { status: "poison" as const, target: "defender" as const } : undefined)
      : eSecEntry && eSecChance && Math.random() < eSecChance ? eSecEntry : undefined;

  // Drain / recoil del enemigo
  const eDrainPct = moveMetadata.meta?.drain ?? 0;
  const eDrainHpDelta = eDrainPct !== 0
    ? Math.max(1, Math.floor(eTotalDmg * Math.abs(eDrainPct) / 100)) * (eDrainPct > 0 ? 1 : -1)
    : undefined;

  // Flinch del jugador
  const eFlinchChance = (moveMetadata.meta?.flinchChance ?? 0) / 100;
  const eFlinch = eFlinchChance > 0 && Math.random() < eFlinchChance ? true : undefined;

  // Para drain del enemigo: el "them" (rival) cura; para recoil: pierde HP
  const newThemHp = enemyExplodes ? 0
    : eDrainHpDelta !== undefined
      ? Math.min(theirStats.hp, Math.max(0, them.hp + eDrainHpDelta))
      : them.hp;

  return {
    ...defaultReturn,
    us: { ...usAfterPP, hp: Math.max(0, us.hp - eTotalDmg) },
    them: { ...them, hp: newThemHp },
    superEffective,
    notVeryEffective,
    critical: isCrit,
    statusApply: eSecondaryStatus,
    drainHeal: eDrainHpDelta,
    flinch: eFlinch,
    requiresRecharge: move === "hyper-beam" ? true : undefined,
  };
};

export default processMove;
