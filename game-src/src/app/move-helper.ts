import { PokemonEncounterType, PokemonInstance } from "../state/state-types";
import { CRITICAL_HIT_MULTIPLIER, CRITICAL_HIT_PERCENTAGE } from "./constants";
import { getTimeOfDay } from "./evolution-helper";
import { areOppositeGenders } from "./gender-helper";
import {
  BRIGHTPOWDER_ACC_DROP,
  FOCUS_BAND_CHANCE,
  KINGS_ROCK_CHANCE,
  getCritItemBonus,
  getSpeciesAttackMult,
  getSpeciesDefenseMult,
  getTypeBoostMult,
} from "./held-item-helper";
import moveMetadataAll from "./move-metadata";
import getTypeEffectiveness from "./type-effectiveness";
import { ItemType } from "./use-item-data";
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
  "string-shot":   { stat: "speed",   target: "defender", delta: -1 },
  // disable: en Gen I bloquea 1 movimiento aleatorio; gestionado en PokemonEncounter

  // Raise own attack
  "sharpen":       { stat: "attack",  target: "attacker", delta: +1 },
  "meditate":      { stat: "attack",  target: "attacker", delta: +1 },
  "swords-dance":  { stat: "attack",  target: "attacker", delta: +2 },
  // focus-energy: se maneja aparte para aplicar +1 crit ratio (Gen II)

  // Raise own defense
  "harden":        { stat: "defense", target: "attacker", delta: +1 },
  "withdraw":      { stat: "defense", target: "attacker", delta: +1 },
  "defense-curl":  { stat: "defense", target: "attacker", delta: +1 },
  "acid-armor":    { stat: "defense", target: "attacker", delta: +2 },
  "barrier":       { stat: "defense", target: "attacker", delta: +2 },

  // Raise own evasion (Gen II: Minimize sube +1)
  "double-team":   { stat: "evasion", target: "attacker", delta: +1 },
  "minimize":      { stat: "evasion", target: "attacker", delta: +1 },

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
  // ── Gen II stat changes ────────────────────────────────────────────────
  "charm":         { stat: "attack",  target: "defender", delta: -2 },
  "howl":          { stat: "attack",  target: "attacker", delta: +1 },
  "scary-face":    { stat: "speed",   target: "defender", delta: -2 },
  "cotton-spore":  { stat: "speed",   target: "defender", delta: -2 },
  "sweet-scent":   { stat: "evasion", target: "defender", delta: -1 },
  "metal-sound":   { stat: "special", target: "defender", delta: -2 },
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
  "glare":         { status: "paralysis",       target: "defender" },
  "poison-gas":    { status: "poison",          target: "defender" },
  "sleep-powder":  { status: "sleep",           target: "defender" },
  "spore":         { status: "sleep",           target: "defender" },
  "sing":          { status: "sleep",           target: "defender" },
  "hypnosis":      { status: "sleep",           target: "defender" },
  "lovely-kiss":   { status: "sleep",           target: "defender" },
  // ── Gen II status moves ────────────────────────────────────────────────
  "yawn":          { status: "sleep",           target: "defender" },
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
  "thunder-shock": { status: "paralysis", target: "defender" },
  "thunder-punch": { status: "paralysis", target: "defender" },
  "blizzard":      { status: "freeze",    target: "defender" },
  "ice-beam":      { status: "freeze",    target: "defender" },
  "ice-punch":     { status: "freeze",    target: "defender" },
  // ── Gen II secundarios de daño ─────────────────────────────────────────
  "spark":         { status: "paralysis", target: "defender" },
  "zap-cannon":    { status: "paralysis", target: "defender" },
  "flame-wheel":   { status: "burn",      target: "defender" },
  "powder-snow":   { status: "freeze",    target: "defender" },
  "sacred-fire":   { status: "burn",      target: "defender" },
  "lava-plume":    { status: "burn",      target: "defender" },
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
  "thunder-shock": 0.10,
  "thunder-punch": 0.10,
  "blizzard":      0.10,
  "ice-beam":      0.10,
  "ice-punch":     0.10,
  // ── Gen II ────────────────────────────────────────────────────────────
  "spark":         0.30,
  "zap-cannon":    1.00,
  "flame-wheel":   0.10,
  "powder-snow":   0.10,
  "sacred-fire":   0.50,
  "lava-plume":    0.30,
};

/** Probabilidad de confusión secundaria de movimientos de daño (Gen I) */
const SECONDARY_CONFUSE_CHANCE: Record<string, number> = {
  "confusion":   0.10,
  "psybeam":     0.10,
  "dizzy-punch": 0.20,
};

/** Cambio de stat secundario en moves de daño — soporta array para ancient-power */
const SECONDARY_STAT_CHANCE: Record<string, { chance: number; change: StatChange | StatChange[] }> = {
  // ── Gen I ─────────────────────────────────────────────────────────────
  "acid":        { chance: 0.10, change: { stat: "special", target: "defender", delta: -1 } },
  "psychic":     { chance: 0.10, change: { stat: "special", target: "defender", delta: -1 } },
  "aurora-beam": { chance: 0.10, change: { stat: "attack",  target: "defender", delta: -1 } },
  "bubble":      { chance: 0.10, change: { stat: "speed",   target: "defender", delta: -1 } },
  "bubble-beam": { chance: 0.10, change: { stat: "speed",   target: "defender", delta: -1 } },
  "constrict":   { chance: 0.10, change: { stat: "speed",   target: "defender", delta: -1 } },
  // ── Gen II ────────────────────────────────────────────────────────────
  "crunch":        { chance: 0.20, change: { stat: "special",  target: "defender", delta: -1 } },
  "iron-tail":     { chance: 0.30, change: { stat: "defense",  target: "defender", delta: -1 } },
  "metal-claw":    { chance: 0.10, change: { stat: "attack",   target: "attacker", delta: +1 } },
  "steel-wing":    { chance: 0.10, change: { stat: "defense",  target: "attacker", delta: +1 } },
  "hammer-arm":    { chance: 1.00, change: { stat: "speed",    target: "attacker", delta: -1 } },
  "ancient-power": { chance: 0.10, change: [
    { stat: "attack",  target: "attacker", delta: +1 },
    { stat: "defense", target: "attacker", delta: +1 },
    { stat: "speed",   target: "attacker", delta: +1 },
    { stat: "special", target: "attacker", delta: +1 },
  ]},
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

/** Movimientos de curación — fracción del HP máximo que se restaura.
 *  Moonlight/Morning Sun/Synthesis se calculan aparte (dependen del clima
 *  y de la hora del día en Gen II). */
const HEAL_FRACTION: Record<string, number> = {
  "recover":      0.5,
  "softboiled":   0.5,
  "milk-drink":   0.5,
  // rest se maneja como caso especial (cura + aplica sueño 2 turnos)
};

/**
 * Curación de Moonlight / Morning Sun / Synthesis (Gen II, verificado en
 * Bulbapedia/pokecrystal): base ¼ · con sol ½ · con otro clima ⅛; y se
 * DUPLICA en la franja horaria preferida del movimiento (Moonlight de
 * noche; Morning Sun y Synthesis de día — este juego usa día/noche).
 */
const timeWeatherHealFraction = (
  move: string,
  weather: "rain" | "sun" | "sandstorm" | null | undefined
): number => {
  let fraction = weather === "sun" ? 0.5 : weather ? 0.125 : 0.25;
  const preferred = move === "moonlight" ? "night" : "day";
  if (getTimeOfDay() === preferred) fraction = Math.min(1, fraction * 2);
  return fraction;
};

/** Movimientos sin efecto visible en combate.
 *  destiny-bond queda fuera de la implementación a propósito: su KO mutuo
 *  simultáneo no es representable en el enrutamiento de stages del motor
 *  (riesgo de combate colgado). */
const NO_EFFECT_MOVES = new Set(["splash", "destiny-bond", "foresight"]);

/** Movimientos que causan confusión (estado volátil real — gestionado en PokemonEncounter) */
export const CONFUSE_MOVES = new Set(["confuse-ray", "supersonic", "sweet-kiss"]);

/** Movimientos de carga de 2 turnos — T1: cargar, T2: atacar (gestionado en PokemonEncounter) */
export const CHARGE_MOVES = new Set(["solar-beam", "razor-wind", "sky-attack", "skull-bash"]);

/** Movimientos de invulnerabilidad de 2 turnos — T1: desaparecer, T2: atacar */
export const INVULNERABLE_MOVES = new Set(["dig", "fly"]);

/** Trap moves Gen I+II — atrapan al rival 2-5 turnos sin dejarle actuar */
export const TRAP_MOVES = new Set(["bind", "wrap", "fire-spin", "clamp", "whirlpool"]);

/** Movimientos exclusivos de Gen I — usados para el sorteo de Metrónomo */
export const GEN1_MOVE_IDS: ReadonlyArray<string> = [
  "pound","karate-chop","double-slap","comet-punch","mega-punch","pay-day",
  "fire-punch","ice-punch","thunder-punch","scratch","vice-grip","guillotine",
  "razor-wind","swords-dance","cut","gust","wing-attack","whirlwind","fly",
  "bind","slam","vine-whip","stomp","double-kick","mega-kick","jump-kick",
  "rolling-kick","sand-attack","headbutt","horn-attack","fury-attack",
  "horn-drill","tackle","body-slam","wrap","take-down","thrash","double-edge",
  "tail-whip","poison-sting","twineedle","pin-missile","leer","bite","growl",
  "roar","sing","supersonic","sonic-boom","disable","acid","ember",
  "flamethrower","mist","water-gun","hydro-pump","surf","ice-beam","blizzard",
  "psybeam","bubble-beam","aurora-beam","hyper-beam","peck","drill-peck",
  "submission","low-kick","counter","seismic-toss","strength","absorb",
  "mega-drain","leech-seed","growth","razor-leaf","solar-beam","poison-powder",
  "stun-spore","sleep-powder","petal-dance","string-shot","dragon-rage",
  "fire-spin","thunder-shock","thunderbolt","thunder-wave","thunder",
  "rock-throw","earthquake","fissure","dig","toxic","confusion","psychic",
  "hypnosis","meditate","agility","quick-attack","rage","teleport",
  "night-shade","mimic","screech","double-team","recover","harden","minimize",
  "smokescreen","confuse-ray","withdraw","defense-curl","barrier",
  "light-screen","haze","reflect","focus-energy","bide","metronome",
  "mirror-move","self-destruct","egg-bomb","lick","smog","sludge","bone-club",
  "fire-blast","waterfall","clamp","swift","skull-bash","spike-cannon",
  "constrict","amnesia","kinesis","softboiled","high-jump-kick","glare",
  "dream-eater","poison-gas","barrage","leech-life","lovely-kiss","sky-attack",
  "transform","bubble","dizzy-punch","spore","flash","psywave","splash",
  "acid-armor","crabhammer","explosion","fury-swipes","bonemerang","rest",
  "rock-slide","hyper-fang","sharpen","conversion","tri-attack","super-fang",
  "slash","substitute","struggle",
];

/** Sorteo de Metrónomo: excluir movimientos sin gestor o auto-referenciales */
const METRONOME_BLACKLIST = new Set([
  "metronome", "struggle", "mirror-move", "transform",
]);

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
  /** Último daño especial recibido (para Mirror Coat) */
  lastSpecialDamageTaken?: number;
  /** ¿El objetivo está dormido? (para Dream Eater) */
  isTargetSleeping: boolean;
  /** Status del atacante — para penalización Gen I de quemadura y Snore */
  attackerStatus?: StatusType | null;
  /** Tipos override del atacante — Conversion (afecta STAB) */
  attackerOverrideTypes?: string[];
  /** El defensor tiene Reflect activo — duplica defense en moves físicos (Gen I) */
  defenderHasReflect?: boolean;
  /** El defensor tiene Light Screen activo — duplica special en moves especiales (Gen I) */
  defenderHasLightScreen?: boolean;
  /** El defensor tiene Substitute activo — daño absorbido por el sustituto */
  defenderHasSubstitute?: boolean;
  /** HP actual del sustituto del defensor */
  defenderSubHp?: number;
  /** BaseSpeed del atacante — fórmula Gen I de crítico */
  attackerBaseSpeed?: number;
  /** El defensor usó Protect/Detect este turno — el ataque falla automáticamente */
  defenderIsProtected?: boolean;
  /** Focus Energy activo en el atacante (Gen II: +1 crit ratio) */
  attackerHasFocusEnergy?: boolean;
  /** Objeto equipado del atacante (Gen II) — potenciadores de tipo ×1.1,
   *  objetos de especie, Periscopio, Roca del Rey. */
  attackerHeldItem?: ItemType | null;
  /** Objeto equipado del defensor (Gen II) — Polvo Brillo, Cinta Focus,
   *  Polvo Metálico. En este juego solo el equipo del jugador lleva objetos. */
  defenderHeldItem?: ItemType | null;
  /** Clima activo en el campo (Gen II): lluvia / sol / tormenta de arena. */
  weather?: "rain" | "sun" | "sandstorm" | null;
  /** El defensor usó Aguante (Endure) este turno: sobrevive con 1 PS. */
  defenderIsEnduring?: boolean;
  /** El atacante usó Fijar Blanco el turno anterior: este ataque no falla. */
  guaranteedHit?: boolean;
  /** Último movimiento usado por el defensor (Encore / Conversión2). */
  defenderLastMoveId?: string | null;
  /** Usos consecutivos previos de Rodar/Corte Furia (rampa de potencia ×2). */
  attackerConsecutiveHits?: number;
  /** El bando del defensor tiene Velo Sagrado: bloquea estados y confusión. */
  defenderHasSafeguard?: boolean;
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
  isNoEffect?: boolean;       // true: el movimiento no hace nada (Salpicadura, etc.)
  // ── Gen I cumplimiento total ────────────────────────────────
  forceFlee?: boolean;        // true: Roar/Whirlwind — termina combate (vs salvaje)
  payDayCoins?: number;       // cantidad acumulada al usar Pay-Day
  startTrap?: { move: string; turns: number }; // Bind/Wrap/Fire-Spin/Clamp T1
  rageHit?: boolean;          // true: el move recibido fue contra usuario en Rage
  startSubstitute?: { hp: number };           // Substitute creado
  subDamage?: number;         // daño absorbido por el sustituto del defensor
  blockedBySub?: boolean;     // status/stat al defensor bloqueado por su sub
  // ── Gen II ───────────────────────────────────────────────────────────
  isProtect?: boolean;        // Protect/Detect — activa escudo este turno
  isSwagger?: boolean;        // Swagger — +2 atk al rival + confusión
  isRapidSpin?: boolean;      // Rapid Spin — limpia trampas del usuario
  isPainSplit?: boolean;      // Pain Split — HP promediados (muestra mensaje)
  isFocusEnergy?: boolean;    // Focus Energy — +1 crit ratio en el usuario
  focusBandSaved?: boolean;   // Cinta Focus — el defensor sobrevivió con 1 PS
  // ── Gen II (fase clima + movimientos) ────────────────────────────────
  startWeather?: "rain" | "sun" | "sandstorm"; // Danza Lluvia / Día Soleado / Tormenta Arena
  isAttract?: boolean;        // Atracción — el defensor queda enamorado
  isEncore?: boolean;         // Bis — el defensor repite su último move 2-6 turnos
  isNightmare?: boolean;      // Pesadilla — el defensor dormido pierde ¼ por turno
  isPerishSong?: boolean;     // Canto Mortal — cuenta de 3 para ambos
  isSpikes?: boolean;         // Púas — en el lado del defensor
  isNoEscape?: boolean;       // Mal de Ojo / Red Viva — el defensor no puede huir
  isLockOn?: boolean;         // Fijar Blanco — el siguiente ataque no falla
  isPsychUp?: boolean;        // Autosugestión — copia los stages del rival
  isEndure?: boolean;         // Aguante — sobrevive con 1 PS este turno
  isSafeguard?: boolean;      // Velo Sagrado — 5 turnos sin estados
  conversion2Type?: string;   // Conversión2 — nuevo tipo del usuario
  futureSightDamage?: number; // Premonición — daño que golpeará en 2 turnos
  enduredHit?: boolean;       // El defensor aguantó el golpe con Aguante
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

  // ── Protect/Detect: bloquea todos los ataques del rival este turno ─────────
  if (move === "protect" || move === "detect") {
    return { ...defaultReturn, isBuff: true, isProtect: true };
  }

  // ── Defend check: el defensor usó Protect/Detect → el ataque falla ─────────
  // Bloquea TODO movimiento dirigido al defensor (daño, estado, stats)
  if (context?.defenderIsProtected) {
    return { ...defaultReturn, missed: true };
  }

  // ── Accuracy check (incluyendo stages de precisión/evasion) ──────────────────
  // Trueno (Gen II): con lluvia nunca falla; con sol su precisión cae al 50%.
  let baseAccuracy: number | null = moveMetadata.accuracy;
  if (move === "thunder") {
    if (context?.weather === "rain") baseAccuracy = null;
    else if (context?.weather === "sun") baseAccuracy = 50;
  }
  // Fijar Blanco (Lock-On): el siguiente ataque del usuario no puede fallar.
  if (context?.guaranteedHit) baseAccuracy = null;
  if (baseAccuracy) {
    // El atacante usa su accuracy stage; el defensor su evasion stage
    const attAccStage  = isAttacking ? myStages.accuracy  : theirStages.accuracy;
    const defEvaStage  = isAttacking ? theirStages.evasion : myStages.evasion;
    // Polvo Brillo del defensor: −20/256 puntos de precisión (Gen II)
    const brightPowderDrop =
      context?.defenderHeldItem === ItemType.BrightPowder ? BRIGHTPOWDER_ACC_DROP : 0;
    const effectiveAcc =
      baseAccuracy * getStageMult(attAccStage) / getStageMult(defEvaStage) -
      brightPowderDrop;
    if (effectiveAcc < Math.random() * 100) {
      // F5 — Jump Kick / High Jump Kick: 1 HP de daño al fallar (Gen I RBY)
      if (move === "jump-kick" || move === "high-jump-kick") {
        return { ...defaultReturn, missed: true, drainHeal: -1 };
      }
      return { ...defaultReturn, missed: true };
    }
  }

  // ── Snore — solo funciona si el atacante está dormido ────────────────────
  if (move === "snore") {
    if (context?.attackerStatus !== "sleep") {
      return { ...defaultReturn, missed: true };
    }
    // Si duerme: cae al bloque de daño normal (move físico normal-type)
  }

  // ── Mirror Coat — devuelve 2× el último daño especial recibido ───────────
  if (move === "mirror-coat") {
    const dmg = Math.max(1, (context?.lastSpecialDamageTaken ?? 0) * 2);
    if (isAttacking) {
      return { ...defaultReturn, them: { ...them, hp: Math.max(0, them.hp - dmg) } };
    }
    return { ...defaultReturn, us: { ...usAfterPP, hp: Math.max(0, us.hp - dmg) } };
  }

  // ── Swagger — sube ataque rival +2 y lo confunde ─────────────────────────
  if (move === "swagger") {
    return {
      ...defaultReturn,
      isDebuff: true,
      isSwagger: true,
      confuse: true,
      statChange: { stat: "attack" as const, target: "defender" as const, delta: +2 },
    };
  }

  // ── Pain Split — promedia los HP de ambos contendientes ──────────────────
  // us/them siempre son usuario/objetivo independientemente de isAttacking;
  // ourStats/theirStats son sus máximos respectivos — no necesitamos ternario.
  if (move === "pain-split") {
    const avg = Math.floor((us.hp + them.hp) / 2);
    return {
      ...defaultReturn,
      isPainSplit: true,
      us:   { ...usAfterPP, hp: Math.min(ourStats.hp,   avg) },
      them: { ...them,      hp: Math.min(theirStats.hp, avg) },
    };
  }

  // ── Rapid Spin — daño físico + limpia trampas del usuario ────────────────
  // isRapidSpin flag recogido en PokemonEncounter para limpiar trap refs
  // La parte de daño cae al bloque estándar; solo inyectamos el flag al final.

  // ── Transformación (copia stats/tipos/movimientos del rival) ─────────────
  if (move === "transform") {
    return { ...defaultReturn, isTransform: true };
  }
  // ── Metrónomo — elige y ejecuta un movimiento aleatorio Gen I ────────────
  if (move === "metronome") {
    const pool = GEN1_MOVE_IDS.filter(
      (id) => !METRONOME_BLACKLIST.has(id) && moveMetadataAll[id] !== undefined
    );
    const randomMove = pool[Math.floor(Math.random() * pool.length)];
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
  // ── Focus Energy (Gen II): +1 crit ratio ───────────────────────────────
  if (move === "focus-energy") {
    return { ...defaultReturn, isBuff: true, isFocusEnergy: true };
  }

  // ── Teleport: huida en salvajes, sin efecto vs entrenadores ─────────────
  if (move === "teleport") {
    return { ...defaultReturn, forceFlee: true };
  }

  // ── Clima (Gen II): Danza Lluvia / Día Soleado / Tormenta Arena ──────────
  if (move === "rain-dance" || move === "sunny-day" || move === "sandstorm") {
    const target =
      move === "rain-dance" ? "rain" : move === "sunny-day" ? "sun" : "sandstorm";
    if (context?.weather === target) {
      return { ...defaultReturn, isNoEffect: true };
    }
    return { ...defaultReturn, isBuff: true, startWeather: target };
  }

  // ── Atracción (Gen II): solo entre géneros opuestos ──────────────────────
  if (move === "attract") {
    const attGender = isAttacking ? us.gender : them.gender;
    const defGender = isAttacking ? them.gender : us.gender;
    if (!areOppositeGenders(attGender, defGender)) {
      return { ...defaultReturn, missed: true };
    }
    return { ...defaultReturn, isDebuff: true, isAttract: true };
  }

  // ── Bis (Encore): el defensor repite su último movimiento ────────────────
  if (move === "encore") {
    if (!context?.defenderLastMoveId) {
      return { ...defaultReturn, missed: true };
    }
    return { ...defaultReturn, isDebuff: true, isEncore: true };
  }

  // ── Pesadilla: solo afecta a objetivos dormidos ──────────────────────────
  if (move === "nightmare") {
    if (!context?.isTargetSleeping) {
      return { ...defaultReturn, missed: true };
    }
    return { ...defaultReturn, isDebuff: true, isNightmare: true };
  }

  // ── Canto Mortal: ambos contendientes se debilitan en 3 turnos ───────────
  if (move === "perish-song") {
    return { ...defaultReturn, isPerishSong: true };
  }

  // ── Púas: trampa en el lado del defensor (afecta a sus cambios) ──────────
  if (move === "spikes") {
    return { ...defaultReturn, isBuff: true, isSpikes: true };
  }

  // ── Mal de Ojo / Red Viva: el defensor no puede huir ni cambiar ──────────
  if (move === "mean-look" || move === "spider-web") {
    return { ...defaultReturn, isDebuff: true, isNoEscape: true };
  }

  // ── Fijar Blanco / Telépata: el siguiente ataque del usuario no falla ────
  if (move === "lock-on" || move === "mind-reader") {
    return { ...defaultReturn, isBuff: true, isLockOn: true };
  }

  // ── Autosugestión: copia los stat stages del rival ───────────────────────
  if (move === "psych-up") {
    return { ...defaultReturn, isBuff: true, isPsychUp: true };
  }

  // ── Aguante: sobrevive cualquier golpe de este turno con 1 PS ────────────
  if (move === "endure") {
    return { ...defaultReturn, isBuff: true, isEndure: true };
  }

  // ── Velo Sagrado: 5 turnos sin estados ni confusión para el usuario ──────
  if (move === "safeguard") {
    return { ...defaultReturn, isBuff: true, isSafeguard: true };
  }

  // ── Tambor (Belly Drum): paga ½ PS máx y maximiza el ataque ──────────────
  if (move === "belly-drum") {
    const userMax = isAttacking ? ourStats.hp : theirStats.hp;
    const userHp  = isAttacking ? us.hp       : them.hp;
    const cost = Math.floor(userMax / 2);
    if (userHp <= cost) {
      return { ...defaultReturn, isNoEffect: true };
    }
    // delta +12 → applyStatChange ya recorta al máximo (+6)
    const maximize: StatChange = { stat: "attack", target: "attacker", delta: +12 };
    if (isAttacking) {
      return { ...defaultReturn, isBuff: true, us: { ...usAfterPP, hp: userHp - cost }, statChange: maximize };
    }
    return { ...defaultReturn, isBuff: true, them: { ...them, hp: userHp - cost }, statChange: maximize };
  }

  // ── Conversión2: el usuario adopta un tipo que resista el último move ────
  if (move === "conversion-2") {
    const lastMove = context?.defenderLastMoveId;
    if (!lastMove) {
      return { ...defaultReturn, missed: true };
    }
    const lastType = getMoveMetadata(lastMove).type;
    const ALL_TYPES = [
      "normal", "fire", "water", "electric", "grass", "ice", "fighting",
      "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
      "dragon", "dark", "steel",
    ];
    const resists = ALL_TYPES.filter((t) => getTypeEffectiveness(lastType, [t]) < 1);
    if (resists.length === 0) {
      return { ...defaultReturn, isNoEffect: true };
    }
    return {
      ...defaultReturn,
      isBuff: true,
      conversion2Type: resists[Math.floor(Math.random() * resists.length)],
    };
  }

  // ── Premonición (Future Sight): golpea 2 turnos después ──────────────────
  // Gen II: 80 de poder, SIN tipo (sin STAB ni efectividad), stats especiales.
  if (move === "future-sight") {
    const lvl    = isAttacking ? us.level : them.level;
    const atkSpc = isAttacking ? ourStats.special : theirStats.special;
    const defSpc = isAttacking ? theirStats.special : ourStats.special;
    const rnd = (217 + Math.floor(Math.random() * 39)) / 255;
    const dmg = Math.max(1, Math.floor(
      (Math.floor(((2 * lvl) / 5 + 2) * 80 * (atkSpc / Math.max(1, defSpc))) / 50 + 2) * rnd
    ));
    return { ...defaultReturn, futureSightDamage: dmg };
  }

  // ── Sin efecto (Splash y no implementados) ──────────────────────────────
  if (NO_EFFECT_MOVES.has(move)) {
    return { ...defaultReturn, isNoEffect: true };
  }

  // ── Confusión (estado volátil — procesado en PokemonEncounter) ──────────
  if (CONFUSE_MOVES.has(move)) {
    // Velo Sagrado (Gen II) también bloquea la confusión
    if (context?.defenderHasSafeguard) {
      return { ...defaultReturn, isNoEffect: true };
    }
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

  // ── Roar / Whirlwind (Gen I) — vs salvaje termina combate; vs entrenador falla
  if (move === "roar" || move === "whirlwind") {
    return { ...defaultReturn, forceFlee: true };
  }

  // ── Substitute (Gen I) — cuesta floor(maxHp/4); sub HP = ese valor + 1 ───
  if (move === "substitute") {
    const userMax = isAttacking ? ourStats.hp : theirStats.hp;
    const userHp  = isAttacking ? us.hp       : them.hp;
    const cost = Math.floor(userMax / 4);
    if (userHp <= cost) {
      // No tiene suficiente HP — falla
      return { ...defaultReturn, isNoEffect: true };
    }
    const subHp = cost + 1;
    if (isAttacking) {
      return {
        ...defaultReturn,
        isBuff: true,
        us: { ...usAfterPP, hp: userHp - cost },
        startSubstitute: { hp: subHp },
      };
    }
    return {
      ...defaultReturn,
      isBuff: true,
      them: { ...them, hp: userHp - cost },
      startSubstitute: { hp: subHp },
    };
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

  // ── Rest: cura HP completo + aplica sueño 2 turnos (Gen I) ─────────────────
  if (move === "rest") {
    // target: "attacker" → cuando isAttacking=true afecta al jugador, cuando false afecta al rival
    const sleepApply: StatusApply = { status: "sleep", target: "attacker", force: true, fixedTurns: 2 };
    if (isAttacking) {
      return { ...defaultReturn, isBuff: true, us: { ...usAfterPP, hp: ourStats.hp }, statusApply: sleepApply };
    }
    return { ...defaultReturn, isBuff: true, them: { ...them, hp: theirStats.hp }, statusApply: sleepApply };
  }

  // ── Curación (Recover, Softboiled, Milk Drink, y las de clima/hora) ──────
  const healFraction =
    move === "moonlight" || move === "morning-sun" || move === "synthesis"
      ? timeWeatherHealFraction(move, context?.weather)
      : HEAL_FRACTION[move];
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

  // ── Magnitud (Gen II): nivel y potencia aleatorios ────────────────────────
  // (power es null en la metadata; hay que resolverlo ANTES del branch de
  // movimientos de estado para que caiga a la rama de daño)
  let overridePower: number | undefined;
  if (move === "magnitude") {
    const r = Math.random();
    const [magLevel, magPower] =
      r < 0.05 ? [4, 10]
      : r < 0.15 ? [5, 30]
      : r < 0.35 ? [6, 50]
      : r < 0.65 ? [7, 70]
      : r < 0.85 ? [8, 90]
      : r < 0.95 ? [9, 110]
      : [10, 150];
    overridePower = magPower;
    defaultReturn.moveName = `Magnitud ${magLevel}`;
  }

  // ── Movimientos de estado (sin daño) ─────────────────────────────────────
  if (!moveMetadata.power && overridePower === undefined) {
    // Condición de estado real (sueño, parálisis, veneno…)
    const statusEntry = STATUS_APPLY_TABLE[move];
    if (statusEntry) {
      // Velo Sagrado (Gen II): bloquea los estados dirigidos al defensor
      if (statusEntry.target === "defender" && context?.defenderHasSafeguard) {
        return { ...defaultReturn, isNoEffect: true };
      }
      // F13.7 — Thunder-wave (y solo thunder-wave) falla vs Pokémon tipo Ground
      if (move === "thunder-wave") {
        const defenderTypes = isAttacking ? theirMetadata.types : ourMetadata.types;
        if (defenderTypes.includes("ground")) {
          return { ...defaultReturn, isNoEffect: true };
        }
      }
      // F12 — status moves al defensor bloqueados si tiene Substitute
      if (statusEntry.target === "defender" && context?.defenderHasSubstitute) {
        return { ...defaultReturn, blockedBySub: true, isNoEffect: true };
      }
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
      const first = Array.isArray(effect) ? effect[0] : (effect as StatChange);
      // F12 — statChange al defensor bloqueado si tiene Substitute
      if (first.target === "defender" && context?.defenderHasSubstitute) {
        return { ...defaultReturn, blockedBySub: true, isNoEffect: true };
      }
      return {
        ...defaultReturn,
        isBuff:    first.delta > 0,
        isDebuff:  first.delta < 0,
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

  // ── Rodar / Corte Furia (Gen II): potencia ×2 por uso consecutivo (cap ×16)
  if (
    (move === "rollout" || move === "fury-cutter") &&
    (context?.attackerConsecutiveHits ?? 0) > 0
  ) {
    const n = Math.min(context?.attackerConsecutiveHits ?? 0, 4);
    overridePower = (moveMetadata.power ?? 10) * Math.pow(2, n);
  }

  // ── Flail / Reversal — potencia variable según HP restante del atacante ───
  if (move === "flail" || move === "reversal") {
    const atkHp    = isAttacking ? us.hp : them.hp;
    const atkMaxHp = isAttacking ? ourStats.hp : theirStats.hp;
    const ratio    = atkHp / Math.max(1, atkMaxHp);
    if      (ratio <= 0.0417) overridePower = 200;
    else if (ratio <= 0.1042) overridePower = 150;
    else if (ratio <= 0.2083) overridePower = 100;
    else if (ratio <= 0.3542) overridePower = 80;
    else if (ratio <= 0.6875) overridePower = 40;
    else                      overridePower = 20;
  }

  // ── Present — potencia aleatoria o cura al rival (Gen II) ────────────────
  if (move === "present") {
    const r = Math.random();
    if (r < 0.40)      overridePower = 40;
    else if (r < 0.70) overridePower = 80;
    else if (r < 0.80) overridePower = 120;
    else {
      // 20%: cura al rival 80 HP en lugar de dañarlo
      if (isAttacking) {
        return { ...defaultReturn, them: { ...them, hp: Math.min(theirStats.hp, them.hp + 80) } };
      }
      return { ...defaultReturn, us: { ...usAfterPP, hp: Math.min(ourStats.hp, us.hp + 80) } };
    }
  }

  // power puede ser null en metadata (p. ej. Magnitud) — overridePower lo cubre
  const effectivePower = overridePower ?? moveMetadata.power ?? 0;

  // Random factor: uniform integer in [217, 255] → [0.851, 1.0]
  const randFactor = (217 + Math.floor(Math.random() * 39)) / 255;

  // ── F13.3 Crítico Gen I — basado en BaseSpeed del atacante ───────────────
  //   normal:    threshold = floor(baseSpeed / 2)  (de 0..255)
  //   high-crit: threshold = min(255, floor(baseSpeed * 8 / 2))  (≈ ÷64)
  //   isCrit = random(0..255) < threshold
  const attackerBaseSpeed = isAttacking
    ? ourMetadata.baseStats.speed
    : theirMetadata.baseStats.speed;
  const attackerSpeciesId = isAttacking ? us.id : them.id;
  const defenderSpeciesId = isAttacking ? them.id : us.id;
  const highCrit = moveMetadata.meta?.critRate === 1;
  const critStage =
    (highCrit ? 1 : 0) +
    (context?.attackerHasFocusEnergy ? 1 : 0) +
    getCritItemBonus(context?.attackerHeldItem, attackerSpeciesId);
  const critMultiplierByStage = critStage >= 2 ? 32 : critStage === 1 ? 8 : 1;
  const critThreshold = Math.min(255, Math.floor((attackerBaseSpeed * critMultiplierByStage) / 2));
  const isCrit = Math.floor(Math.random() * 256) < critThreshold;
  const critMult = isCrit ? CRITICAL_HIT_MULTIPLIER : 1;

  // ── Helpers compartidos para las ramas de daño ───────────────────────────
  const isPhysical = moveMetadata.damageClass === "physical";
  const burnPenalty =
    isPhysical && context?.attackerStatus === "burn" ? 0.5 : 1;
  // F9 Reflect/Light Screen — duplican defense salvo en críticos
  const screenMult =
    !isCrit &&
    ((isPhysical && context?.defenderHasReflect) ||
      (!isPhysical && context?.defenderHasLightScreen))
      ? 2
      : 1;
  // F10 Conversion — STAB usa los tipos override del atacante
  const attackerTypes = context?.attackerOverrideTypes ?? null;
  // Objetos equipados (Gen II): potenciador de tipo ×1.1 + objetos de especie
  // (Bola Luminosa, Hueso Grueso) en ataque; Polvo Metálico en defensa.
  const itemAtkMult =
    getTypeBoostMult(context?.attackerHeldItem, moveMetadata.type) *
    getSpeciesAttackMult(context?.attackerHeldItem, attackerSpeciesId, isPhysical);
  const itemDefMult = getSpeciesDefenseMult(context?.defenderHeldItem, defenderSpeciesId);
  // Roca del Rey: 30/256 de flinch en moves de daño sin flinch propio (Gen II)
  const kingsRockFlinch = (inherentFlinch: number): boolean =>
    inherentFlinch === 0 &&
    context?.attackerHeldItem === ItemType.KingsRock &&
    Math.random() < KINGS_ROCK_CHANCE;
  // Cinta Focus: 30/256 de sobrevivir un golpe letal con 1 PS (Gen II)
  const focusBandSaves = (prevHp: number, newHp: number): boolean =>
    newHp <= 0 &&
    prevHp > 0 &&
    context?.defenderHeldItem === ItemType.FocusBand &&
    Math.random() < FOCUS_BAND_CHANCE;
  // Clima (Gen II): lluvia potencia Agua ×1.5 y debilita Fuego ×0.5; el sol,
  // al revés. Rayo Solar pega a la mitad con lluvia o tormenta de arena.
  const weatherNow = context?.weather ?? null;
  let weatherMult = 1;
  if (weatherNow === "rain") {
    if (moveMetadata.type === "water") weatherMult = 1.5;
    else if (moveMetadata.type === "fire") weatherMult = 0.5;
    if (move === "solar-beam") weatherMult *= 0.5;
  } else if (weatherNow === "sun") {
    if (moveMetadata.type === "fire") weatherMult = 1.5;
    else if (moveMetadata.type === "water") weatherMult = 0.5;
  } else if (weatherNow === "sandstorm" && move === "solar-beam") {
    weatherMult *= 0.5;
  }

  if (isAttacking) {
    // Player attacking enemy
    // If critical hit, ignore stat stages (Gen I behaviour)
    const rawAtk = isPhysical ? ourStats.attack    : ourStats.special;
    const baseRawDef = isPhysical ? theirStats.defense : theirStats.special;
    const rawDef =
      isPhysical && (move === "self-destruct" || move === "explosion")
        ? Math.max(1, Math.floor(baseRawDef / 2))
        : baseRawDef;
    const atkStage  = isCrit ? 0 : (isPhysical ? myStages.attack    : myStages.special);
    const defStage  = isCrit ? 0 : (isPhysical ? theirStages.defense : theirStages.special);
    const attack  = rawAtk * getStageMult(atkStage) * burnPenalty * itemAtkMult;
    const defense = rawDef * getStageMult(defStage) * screenMult * itemDefMult;

    const stabTypes      = attackerTypes ?? ourMetadata.types;
    const stab           = stabTypes.includes(moveMetadata.type) ? 1.5 : 1;
    const typeEff        = getTypeEffectiveness(moveMetadata.type, theirMetadata.types);
    // Inmunidad de tipo: el movimiento no tiene ningún efecto.
    if (typeEff === 0) return { ...defaultReturn, isNoEffect: true };
    const superEffective  = typeEff > 1;
    const notVeryEffective = typeEff > 0 && typeEff < 1;

    const baseDamage = Math.max(1, Math.floor(
      (Math.floor(((2 * us.level) / 5 + 2) * effectivePower * (attack / defense)) / 50 + 2) *
        stab * typeEff * critMult * randFactor * weatherMult
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

    // F12 — Substitute del defensor absorbe daño (Gen I bug: sin overflow)
    const subActive = !!context?.defenderHasSubstitute;
    const subHp = context?.defenderSubHp ?? 0;
    const subDamage = subActive ? Math.min(totalDamage, subHp) : 0;
    const damageToHp = subActive ? 0 : totalDamage;

    // Efecto secundario de estado (body-slam, thunderbolt, flamethrower…)
    const secEntry = STATUS_APPLY_TABLE[move];
    const secChance = SECONDARY_STATUS_CHANCE[move];
    let secondaryStatus: StatusApply | undefined =
      subActive
        ? undefined
        : move === "twineedle"
          ? (twineedlePoison ? { status: "poison" as const, target: "defender" as const } : undefined)
          : secEntry && secChance && Math.random() < secChance ? secEntry : undefined;
    // Tri-attack no va en STATUS_APPLY_TABLE porque el estado es aleatorio; se resuelve aquí
    if (!secondaryStatus && move === "tri-attack" && !subActive && Math.random() < 0.20) {
      const statuses = ["paralysis", "burn", "freeze"] as const;
      secondaryStatus = { status: statuses[Math.floor(Math.random() * 3)], target: "defender" };
    }
    // Velo Sagrado del defensor: bloquea estados y confusión secundarios
    if (context?.defenderHasSafeguard && secondaryStatus?.target === "defender") {
      secondaryStatus = undefined;
    }

    // F2 — Confusión secundaria (Confusion, Psybeam, Dizzy Punch)
    const confChance = SECONDARY_CONFUSE_CHANCE[move];
    const secondaryConfuse =
      !subActive && !context?.defenderHasSafeguard && confChance && Math.random() < confChance
        ? true : false;

    // F3 — Cambio de stat secundario (Acid, Aurora Beam, Bubble, Constrict, Psychic…)
    const statSec = SECONDARY_STAT_CHANCE[move];
    const secondaryStat: StatChange | StatChange[] | undefined =
      !subActive && statSec && Math.random() < statSec.chance
        ? statSec.change
        : undefined;

    // Drain / recoil (meta.drain: 50 = cura 50% daño; -25 = recoil 25% daño)
    const drainPct = moveMetadata.meta?.drain ?? 0;
    // F5 — meta.healing < 0 = recoil sobre el atacante (Struggle)
    const healingPct = moveMetadata.meta?.healing ?? 0;
    let drainHpDelta: number | undefined;
    if (drainPct !== 0) {
      // Drain: si el sub absorbe el daño, no se cura (Gen I correcto)
      const drainBase = subActive && drainPct > 0 ? 0 : totalDamage;
      drainHpDelta = drainBase > 0
        ? Math.max(1, Math.floor(drainBase * Math.abs(drainPct) / 100)) * (drainPct > 0 ? 1 : -1)
        : undefined;
    }
    if (healingPct < 0) {
      const recoil = -Math.max(1, Math.floor(totalDamage * Math.abs(healingPct) / 100));
      drainHpDelta = (drainHpDelta ?? 0) + recoil;
    }

    // Flinch: el objetivo no puede actuar este turno (propio o Roca del Rey)
    const flinchChance = (moveMetadata.meta?.flinchChance ?? 0) / 100;
    const flinch = !subActive &&
      ((flinchChance > 0 && Math.random() < flinchChance) || kingsRockFlinch(flinchChance))
        ? true : undefined;

    const newUsHp = selfDestructs ? 0
      : drainHpDelta !== undefined
        ? Math.min(ourStats.hp, Math.max(0, usAfterPP.hp + drainHpDelta))
        : usAfterPP.hp;

    // F8 — Pay Day añade monedas
    const payDayCoins = move === "pay-day" ? 2 * us.level : undefined;
    // F4 — Trap moves T1 (Bind/Wrap/Fire-Spin/Clamp) atrapan al rival 2-5 turnos
    const startTrap = TRAP_MOVES.has(move)
      ? { move, turns: 2 + Math.floor(Math.random() * 4) }
      : undefined;

    // Aguante del defensor: sobrevive el golpe con 1 PS (determinista)
    let finalThemHp = Math.max(0, them.hp - damageToHp);
    let themEndured = false;
    if (finalThemHp === 0 && them.hp > 0 && context?.defenderIsEnduring) {
      finalThemHp = 1;
      themEndured = true;
    }
    // Cinta Focus del defensor: sobrevive el golpe letal con 1 PS
    let themFocusBandSaved = false;
    if (!themEndured && focusBandSaves(them.hp, finalThemHp)) {
      finalThemHp = 1;
      themFocusBandSaved = true;
    }

    return {
      ...defaultReturn,
      them: { ...them, hp: finalThemHp },
      us: { ...usAfterPP, hp: newUsHp },
      focusBandSaved: themFocusBandSaved || undefined,
      enduredHit: themEndured || undefined,
      superEffective,
      notVeryEffective,
      critical: isCrit,
      statusApply: secondaryStatus,
      statChange: secondaryStat,
      confuse: secondaryConfuse || undefined,
      drainHeal: drainHpDelta,
      flinch,
      requiresRecharge: move === "hyper-beam" ? true : undefined,
      payDayCoins,
      startTrap,
      subDamage: subDamage > 0 ? subDamage : undefined,
      isRapidSpin: move === "rapid-spin" ? true : undefined,
    };
  }

  // Enemy attacking player
  const eRawAtk = isPhysical ? theirStats.attack    : theirStats.special;
  const eBaseRawDef = isPhysical ? ourStats.defense : ourStats.special;
  const eRawDef =
    isPhysical && (move === "self-destruct" || move === "explosion")
      ? Math.max(1, Math.floor(eBaseRawDef / 2))
      : eBaseRawDef;
  const eAtkStage  = isCrit ? 0 : (isPhysical ? theirStages.attack    : theirStages.special);
  const eDefStage  = isCrit ? 0 : (isPhysical ? myStages.defense      : myStages.special);
  const eAttack  = eRawAtk * getStageMult(eAtkStage) * burnPenalty * itemAtkMult;
  const eDefense = eRawDef * getStageMult(eDefStage) * screenMult * itemDefMult;

  const eStabTypes      = attackerTypes ?? theirMetadata.types;
  const stab           = eStabTypes.includes(moveMetadata.type) ? 1.5 : 1;
  const typeEff        = getTypeEffectiveness(moveMetadata.type, ourMetadata.types);
  // Inmunidad de tipo: el movimiento no tiene ningún efecto.
  if (typeEff === 0) return { ...defaultReturn, isNoEffect: true };
  const superEffective  = typeEff > 1;
  const notVeryEffective = typeEff > 0 && typeEff < 1;

  const baseDmg = Math.max(1, Math.floor(
    (Math.floor(((2 * them.level) / 5 + 2) * effectivePower * (eAttack / eDefense)) / 50 + 2) *
      stab * typeEff * critMult * randFactor * weatherMult
  ));

  // Movimientos multihit
  const { minHits: eMin, maxHits: eMax } = moveMetadata.meta ?? {};
  const eHits =
    eMin != null && eMax != null
      ? genIMultiHitCount(eMin, eMax)
      : 1;
  const eTwineedlePoison =
    move === "twineedle" && eHits > 0
      ? Array.from({ length: eHits }).some(() => Math.random() < 0.20)
      : false;
  const eTotalDmg = baseDmg * eHits;

  const enemyExplodes = move === "self-destruct" || move === "explosion";

  // F12 — Substitute del jugador absorbe daño del enemigo
  const eSubActive = !!context?.defenderHasSubstitute;
  const eSubHp = context?.defenderSubHp ?? 0;
  const eSubDamage = eSubActive ? Math.min(eTotalDmg, eSubHp) : 0;
  const eDamageToHp = eSubActive ? 0 : eTotalDmg;

  // Efecto secundario de estado del enemigo
  const eSecEntry = STATUS_APPLY_TABLE[move];
  const eSecChance = SECONDARY_STATUS_CHANCE[move];
  let eSecondaryStatus: StatusApply | undefined =
    eSubActive
      ? undefined
      : move === "twineedle"
        ? (eTwineedlePoison ? { status: "poison" as const, target: "defender" as const } : undefined)
        : eSecEntry && eSecChance && Math.random() < eSecChance ? eSecEntry : undefined;
  if (!eSecondaryStatus && move === "tri-attack" && !eSubActive && Math.random() < 0.20) {
    const statuses = ["paralysis", "burn", "freeze"] as const;
    eSecondaryStatus = { status: statuses[Math.floor(Math.random() * 3)], target: "defender" };
  }
  // Velo Sagrado del defensor (jugador): bloquea estados y confusión secundarios
  if (context?.defenderHasSafeguard && eSecondaryStatus?.target === "defender") {
    eSecondaryStatus = undefined;
  }

  const eConfChance = SECONDARY_CONFUSE_CHANCE[move];
  const eSecondaryConfuse =
    !eSubActive && !context?.defenderHasSafeguard && eConfChance && Math.random() < eConfChance
      ? true : false;

  const eStatSec = SECONDARY_STAT_CHANCE[move];
  const eSecondaryStat: StatChange | StatChange[] | undefined =
    !eSubActive && eStatSec && Math.random() < eStatSec.chance
      ? eStatSec.change
      : undefined;

  // Drain / recoil del enemigo
  const eDrainPct = moveMetadata.meta?.drain ?? 0;
  const eHealingPct = moveMetadata.meta?.healing ?? 0;
  let eDrainHpDelta: number | undefined;
  if (eDrainPct !== 0) {
    const drainBase = eSubActive && eDrainPct > 0 ? 0 : eTotalDmg;
    eDrainHpDelta = drainBase > 0
      ? Math.max(1, Math.floor(drainBase * Math.abs(eDrainPct) / 100)) * (eDrainPct > 0 ? 1 : -1)
      : undefined;
  }
  if (eHealingPct < 0) {
    const recoil = -Math.max(1, Math.floor(eTotalDmg * Math.abs(eHealingPct) / 100));
    eDrainHpDelta = (eDrainHpDelta ?? 0) + recoil;
  }

  const eFlinchChance = (moveMetadata.meta?.flinchChance ?? 0) / 100;
  const eFlinch = !eSubActive &&
    ((eFlinchChance > 0 && Math.random() < eFlinchChance) || kingsRockFlinch(eFlinchChance))
      ? true : undefined;

  const newThemHp = enemyExplodes ? 0
    : eDrainHpDelta !== undefined
      ? Math.min(theirStats.hp, Math.max(0, them.hp + eDrainHpDelta))
      : them.hp;

  const eStartTrap = TRAP_MOVES.has(move)
    ? { move, turns: 2 + Math.floor(Math.random() * 4) }
    : undefined;

  // Aguante del jugador: sobrevive el golpe con 1 PS (determinista)
  let finalUsHp = Math.max(0, us.hp - eDamageToHp);
  let usEndured = false;
  if (finalUsHp === 0 && us.hp > 0 && context?.defenderIsEnduring) {
    finalUsHp = 1;
    usEndured = true;
  }
  // Cinta Focus del jugador: sobrevive el golpe letal con 1 PS (Gen II)
  let usFocusBandSaved = false;
  if (!usEndured && focusBandSaves(us.hp, finalUsHp)) {
    finalUsHp = 1;
    usFocusBandSaved = true;
  }

  return {
    ...defaultReturn,
    us: { ...usAfterPP, hp: finalUsHp },
    them: { ...them, hp: newThemHp },
    focusBandSaved: usFocusBandSaved || undefined,
    enduredHit: usEndured || undefined,
    superEffective,
    notVeryEffective,
    critical: isCrit,
    statusApply: eSecondaryStatus,
    statChange: eSecondaryStat,
    confuse: eSecondaryConfuse || undefined,
    drainHeal: eDrainHpDelta,
    flinch: eFlinch,
    requiresRecharge: move === "hyper-beam" ? true : undefined,
    startTrap: eStartTrap,
    subDamage: eSubDamage > 0 ? eSubDamage : undefined,
    isRapidSpin: move === "rapid-spin" ? true : undefined,
  };
};

export default processMove;
