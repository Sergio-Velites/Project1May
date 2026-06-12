// ─────────────────────────────────────────────────────────────────────────
// Motor de combate de enlace (Club Cable, Gen II).
//
// En un combate EN VIVO los dos jugadores eligen acción; el ANFITRIÓN
// (host) resuelve el turno completo con este motor (reutilizando el
// `processMove` del combate normal) y publica una lista de eventos
// serializables. Ambos visores (LinkBattleRoom) reproducen esos eventos,
// así que NUNCA hay desincronización: el guest no calcula nada.
//
// Reglas del Coliseo (fieles a Oro/Plata):
//   · Los Pokémon entran tal y como están (PS y estado actuales).
//   · No se pueden usar objetos de la mochila; los equipados sí funcionan.
//   · Huir = rendirse.
//   · El combate usa COPIAS: al terminar, el equipo real queda intacto.
//
// Limitaciones documentadas (v1): sin clima, Bide, Counter parcial (sí
// soporta Counter/Mirror Coat vía último daño), sin Sustituto ni moves de
// 2 fases exóticos. Los moves de carga (Rayo Solar...) gastan su turno de
// carga como en el original.
// ─────────────────────────────────────────────────────────────────────────
import processMove, {
  DEFAULT_STAGES,
  StatStages,
  StatChange,
  MoveContext,
  MoveResult,
  getStageMult,
  isChargeMove,
  CHARGE_MESSAGE,
} from "./move-helper";
import { getPokemonMetadata } from "./use-pokemon-metadata";
import { getPokemonStats } from "./use-pokemon-stats";
import { getMoveMetadata } from "./use-move-metadata";
import {
  BattleStatus,
  PokemonEncounterType,
  PokemonInstance,
} from "../state/state-types";
import {
  LinkBattleAction,
  LinkBattleEvent,
  LinkRole,
} from "./link-session";

const STAT_NAMES_ES: Record<string, string> = {
  attack: "ATAQUE",
  defense: "DEFENSA",
  speed: "VELOCIDAD",
  special: "ESPECIAL",
  accuracy: "PRECISIÓN",
  evasion: "EVASION",
};

const STATUS_MSG: Record<string, string> = {
  poison: "quedó envenenado",
  "badly-poisoned": "quedó gravemente envenenado",
  burn: "sufrió una quemadura",
  paralysis: "quedó paralizado",
  sleep: "se quedó dormido",
  freeze: "se congeló",
  "leech-seed": "fue sembrado con Drenadoras",
};

/** Estado volátil de un bando durante el combate de enlace (solo host). */
export interface LinkSideState {
  party: PokemonInstance[];
  activeIndex: number;
  stages: StatStages;
  confusionTurns: number;
  flinched: boolean;
  attracted: boolean;
  protectedNow: boolean;
  protectStreak: number;
  focusEnergy: boolean;
  reflectTurns: number;
  lightScreenTurns: number;
  lastPhysicalDamageTaken: number;
  lastSpecialDamageTaken: number;
  hyperBeamRecharge: boolean;
  chargingMove: string | null;
  usedProtectThisTurn: boolean;
}

export interface LinkBattleSim {
  host: LinkSideState;
  guest: LinkSideState;
  names: { host: string; guest: string };
}

export interface LinkTurnOutcome {
  events: LinkBattleEvent[];
  needSwitch: { host: boolean; guest: boolean };
  winner: LinkRole | "draw" | null;
}

const freshVolatile = () => ({
  stages: { ...DEFAULT_STAGES },
  confusionTurns: 0,
  flinched: false,
  attracted: false,
  protectedNow: false,
  protectStreak: 0,
  focusEnergy: false,
  reflectTurns: 0,
  lightScreenTurns: 0,
  hyperBeamRecharge: false,
  chargingMove: null,
  usedProtectThisTurn: false,
});

const makeSide = (party: PokemonInstance[]): LinkSideState => ({
  party: party.map((p) => ({ ...p, moves: p.moves.map((m) => ({ ...m })) })),
  activeIndex: Math.max(0, party.findIndex((p) => p.hp > 0)),
  lastPhysicalDamageTaken: 0,
  lastSpecialDamageTaken: 0,
  ...freshVolatile(),
});

export const createLinkBattleSim = (
  hostParty: PokemonInstance[],
  guestParty: PokemonInstance[],
  names: { host: string; guest: string }
): LinkBattleSim => ({
  host: makeSide(hostParty),
  guest: makeSide(guestParty),
  names,
});

const other = (side: LinkRole): LinkRole =>
  side === "host" ? "guest" : "host";

const active = (s: LinkSideState): PokemonInstance => s.party[s.activeIndex];

const hasAlive = (s: LinkSideState): boolean => s.party.some((p) => p.hp > 0);

/** "PIKACHU de SERGIO" — nombre inequívoco para los dos visores. */
const tag = (sim: LinkBattleSim, side: LinkRole): string =>
  `${getPokemonMetadata(active(sim[side]).id).name.toUpperCase()} de ${
    sim.names[side].toUpperCase()
  }`;

const effectiveSpeed = (s: LinkSideState): number => {
  const mon = active(s);
  let speed = getPokemonStats(mon.id, mon.level).speed *
    getStageMult(s.stages.speed);
  if (mon.status?.type === "paralysis") speed *= 0.25;
  return speed;
};

// ── Chequeo de "no puede actuar" (port de checkSkipTurn) ───────────────────
const checkSkip = (
  sim: LinkBattleSim,
  side: LinkRole,
  events: LinkBattleEvent[]
): boolean => {
  const s = sim[side];
  const mon = active(s);
  const name = tag(sim, side);

  if (s.flinched) {
    s.flinched = false;
    events.push({ t: "msg", text: `¡${name} no puede moverse!` });
    return true;
  }

  if (s.attracted && Math.random() < 0.5) {
    events.push({
      t: "msg",
      text: `¡${name} está enamorado y no puede atacar!`,
    });
    return true;
  }

  if (s.confusionTurns > 0) {
    s.confusionTurns -= 1;
    if (s.confusionTurns <= 0) {
      events.push({ t: "msg", text: `¡${name} superó la confusión!` });
    } else {
      events.push({ t: "msg", text: `¡${name} está confuso!` });
      if (Math.random() < 0.5) {
        const stats = getPokemonStats(mon.id, mon.level);
        const selfDmg = Math.max(
          1,
          Math.floor(
            Math.floor(
              ((2 * mon.level) / 5 + 2) * 40 * (stats.attack / stats.defense)
            ) / 50
          ) + 2
        );
        mon.hp = Math.max(0, mon.hp - selfDmg);
        events.push({ t: "msg", text: `¡${name} se golpeó por la confusión!` });
        events.push({ t: "hp", side, hp: mon.hp });
        return true;
      }
    }
  }

  const status = mon.status;
  if (!status) return false;

  if (status.type === "sleep") {
    const newTurns = status.turns - 1;
    if (newTurns <= 0) {
      mon.status = null;
      events.push({ t: "msg", text: `¡${name} se despertó!` });
      events.push({ t: "status", side, status: null });
      return false;
    }
    mon.status = { ...status, turns: newTurns };
    events.push({ t: "msg", text: `¡${name} está dormido...!` });
    return true;
  }
  if (status.type === "freeze") {
    if (Math.random() < 0.2) {
      mon.status = null;
      events.push({ t: "msg", text: `¡${name} se descongeló!` });
      events.push({ t: "status", side, status: null });
      return false;
    }
    events.push({ t: "msg", text: `¡${name} está congelado!` });
    return true;
  }
  if (status.type === "paralysis" && Math.random() < 0.25) {
    events.push({
      t: "msg",
      text: `¡${name} está paralizado! ¡No puede moverse!`,
    });
    return true;
  }
  return false;
};

// ── Aplicar cambios de stats con mensajes ──────────────────────────────────
const applyStatChange = (
  sim: LinkBattleSim,
  attackerSide: LinkRole,
  statChange: MoveResult["statChange"],
  events: LinkBattleEvent[]
) => {
  if (!statChange) return;
  const changes: StatChange[] = Array.isArray(statChange)
    ? statChange
    : [statChange];
  for (const { stat, target, delta } of changes) {
    const targetSide = target === "attacker" ? attackerSide : other(attackerSide);
    const s = sim[targetSide];
    const name = tag(sim, targetSide);
    const statName = STAT_NAMES_ES[stat] ?? stat.toUpperCase();
    const current = s.stages[stat];
    if (delta > 0 && current >= 6) {
      events.push({ t: "msg", text: `¡El ${statName} de ${name} no subirá más!` });
      continue;
    }
    if (delta < 0 && current <= -6) {
      events.push({ t: "msg", text: `¡El ${statName} de ${name} no bajará más!` });
      continue;
    }
    s.stages[stat] = Math.max(-6, Math.min(6, current + delta));
    const dir = delta > 0 ? "subió" : "bajó";
    const magnitude = Math.abs(delta) >= 2 ? " mucho" : "";
    events.push({ t: "msg", text: `¡El ${statName} de ${name}${magnitude} ${dir}!` });
  }
};

// ── Ejecutar el movimiento de un bando ─────────────────────────────────────
const performMove = (
  sim: LinkBattleSim,
  side: LinkRole,
  moveId: string,
  events: LinkBattleEvent[]
) => {
  const attacker = sim[side];
  const defender = sim[other(side)];
  const atkMon = active(attacker);
  const defMon = active(defender);
  const atkName = tag(sim, side);
  const defName = tag(sim, other(side));

  // Recarga de Hiperrayo: pierde el turno.
  if (attacker.hyperBeamRecharge) {
    attacker.hyperBeamRecharge = false;
    events.push({ t: "msg", text: `¡${atkName} debe recargar energía!` });
    return;
  }

  // Movimiento de carga (Rayo Solar...): primer turno carga, segundo dispara.
  if (attacker.chargingMove) {
    moveId = attacker.chargingMove;
    attacker.chargingMove = null;
  } else if (isChargeMove(moveId)) {
    attacker.chargingMove = moveId;
    events.push({ t: "msg", text: `¡${atkName} usó ${getMoveMetadata(moveId).name.toUpperCase()}!` });
    events.push({
      t: "msg",
      text: CHARGE_MESSAGE[moveId]
        ? `¡${atkName} ${CHARGE_MESSAGE[moveId]}!`
        : `¡${atkName} está acumulando energía!`,
    });
    return;
  }

  if (checkSkip(sim, side, events)) return;

  // Sin PP en todos los moves → Forcejeo (lo decide también el cliente,
  // esto es la red de seguridad del host).
  const moveState = atkMon.moves.find((m) => m.id === moveId);
  if (moveId !== "struggle" && (!moveState || moveState.pp <= 0)) {
    moveId = "struggle";
  }

  const defenderAsEncounter: PokemonEncounterType = {
    id: defMon.id,
    level: defMon.level,
    hp: defMon.hp,
    moves: defMon.moves.map((m) => m.id),
    gender: defMon.gender,
  };

  const context: MoveContext = {
    lastPhysicalDamageTaken: attacker.lastPhysicalDamageTaken,
    lastSpecialDamageTaken: attacker.lastSpecialDamageTaken,
    isTargetSleeping: defMon.status?.type === "sleep",
    attackerStatus: atkMon.status?.type ?? null,
    defenderIsProtected: defender.protectedNow,
    attackerHasFocusEnergy: attacker.focusEnergy,
    attackerHeldItem: atkMon.heldItem ?? null,
    defenderHeldItem: defMon.heldItem ?? null,
    defenderHasReflect: defender.reflectTurns > 0,
    defenderHasLightScreen: defender.lightScreenTurns > 0,
    attackerBaseSpeed: getPokemonMetadata(atkMon.id).baseStats.speed,
  };

  const result = processMove(
    atkMon,
    defenderAsEncounter,
    moveId,
    true,
    { us: attacker.stages, them: defender.stages },
    context
  );

  events.push({
    t: "msg",
    text: `¡${atkName} usó ${result.moveName.toUpperCase()}!`,
  });

  // Propagar PP/HP del atacante (drain y recoil ya vienen aplicados en `us`).
  attacker.party[attacker.activeIndex] = result.us;
  const newAtkMon = attacker.party[attacker.activeIndex];

  if (result.missed) {
    events.push({ t: "msg", text: `¡${atkName} falló!` });
    return;
  }

  events.push({ t: "anim", side, moveId });

  // Daño al defensor.
  const damage = Math.max(0, defMon.hp - result.them.hp);
  if (damage > 0) {
    defMon.hp = result.them.hp;
    events.push({ t: "hp", side: other(side), hp: defMon.hp });
    const moveMeta = getMoveMetadata(moveId);
    if (moveMeta?.damageClass === "physical") {
      defender.lastPhysicalDamageTaken = damage;
    } else if (moveMeta?.damageClass === "special") {
      defender.lastSpecialDamageTaken = damage;
    }
  }

  if (result.critical) {
    events.push({ t: "msg", text: "¡Un golpe crítico!" });
  }
  if (result.superEffective) {
    events.push({ t: "msg", text: "¡Es muy eficaz!" });
  } else if (result.notVeryEffective) {
    events.push({ t: "msg", text: "No es muy eficaz..." });
  }
  if (result.isNoEffect) {
    events.push({ t: "msg", text: "¡Pero no pasó nada!" });
  }

  // Drain / recoil: el HP de `us` ya cambió; solo narramos.
  if (result.drainHeal && result.drainHeal > 0) {
    events.push({ t: "msg", text: `¡${atkName} recuperó energía!` });
  } else if (result.drainHeal && result.drainHeal < 0) {
    events.push({ t: "msg", text: `¡${atkName} se hirió por el retroceso!` });
  }
  if (newAtkMon.hp !== atkMon.hp || result.drainHeal) {
    events.push({ t: "hp", side, hp: newAtkMon.hp });
  }

  // Protect / Detect.
  if (result.isProtect) {
    const succeeds =
      attacker.protectStreak === 0 ||
      Math.random() < 1 / Math.pow(2, attacker.protectStreak);
    if (succeeds) {
      attacker.protectedNow = true;
      attacker.usedProtectThisTurn = true;
      attacker.protectStreak += 1;
      events.push({ t: "msg", text: `¡${atkName} se protegió!` });
    } else {
      attacker.protectStreak = 0;
      events.push({ t: "msg", text: `¡Pero falló!` });
    }
    return;
  }

  // Cambios de stats / estado / confusión / flinch / extras.
  applyStatChange(sim, side, result.statChange, events);

  if (result.statusApply) {
    const targetSide = result.statusApply.target === "attacker" ? side : other(side);
    const targetMon = active(sim[targetSide]);
    // Drenadoras y dobles estados: simplificación v1 — un estado a la vez.
    if (!targetMon.status || result.statusApply.force) {
      if (result.statusApply.status !== "leech-seed") {
        const newStatus: BattleStatus = {
          type: result.statusApply.status as BattleStatus["type"],
          turns:
            result.statusApply.fixedTurns !== undefined
              ? result.statusApply.fixedTurns
              : result.statusApply.status === "sleep"
              ? 1 + Math.floor(Math.random() * 6)
              : 1,
        };
        targetMon.status = newStatus;
        events.push({
          t: "msg",
          text: `¡${tag(sim, targetSide)} ${STATUS_MSG[newStatus.type] ?? "cambió de estado"}!`,
        });
        events.push({ t: "status", side: targetSide, status: newStatus });
      }
    }
  }

  if (result.confuse && defender.confusionTurns === 0 && defMon.status?.type !== "sleep") {
    defender.confusionTurns = 2 + Math.floor(Math.random() * 4);
    events.push({ t: "msg", text: `¡${defName} está confuso!` });
  }
  if (result.isSwagger) {
    defender.confusionTurns = Math.max(defender.confusionTurns, 2 + Math.floor(Math.random() * 4));
  }
  if (result.isAttract) {
    defender.attracted = true;
    events.push({ t: "msg", text: `¡${defName} se enamoró!` });
  }
  if (result.flinch) defender.flinched = true;
  if (result.requiresRecharge) attacker.hyperBeamRecharge = true;
  if (result.isFocusEnergy) {
    attacker.focusEnergy = true;
    events.push({ t: "msg", text: `¡${atkName} se está concentrando!` });
  }
  if (result.isHaze) {
    sim.host.stages = { ...DEFAULT_STAGES };
    sim.guest.stages = { ...DEFAULT_STAGES };
    events.push({ t: "msg", text: "¡Se eliminaron todos los cambios de estadísticas!" });
  }
  if (result.fieldEffect === "reflect") {
    attacker.reflectTurns = 5;
    events.push({ t: "msg", text: `¡Aparece REFLEJO alrededor de ${atkName}!` });
  }
  if (result.fieldEffect === "light-screen") {
    attacker.lightScreenTurns = 5;
    events.push({ t: "msg", text: `¡Aparece PANTALLA LUZ alrededor de ${atkName}!` });
  }
  if (result.isPainSplit) {
    events.push({ t: "msg", text: "¡Los combatientes compartieron su dolor!" });
    events.push({ t: "hp", side, hp: active(attacker).hp });
    events.push({ t: "hp", side: other(side), hp: defMon.hp });
  }
  if (result.isPsychUp) {
    attacker.stages = { ...defender.stages };
    events.push({ t: "msg", text: `¡${atkName} copió los cambios de estadísticas!` });
  }
};

// ── Cambio de Pokémon ──────────────────────────────────────────────────────
const performSwitch = (
  sim: LinkBattleSim,
  side: LinkRole,
  index: number,
  events: LinkBattleEvent[]
) => {
  const s = sim[side];
  if (index < 0 || index >= s.party.length || s.party[index].hp <= 0) {
    // Índice inválido (cliente corrupto): elegir el primero vivo.
    index = s.party.findIndex((p) => p.hp > 0);
    if (index < 0) return;
  }
  const player = sim.names[side].toUpperCase();
  if (s.activeIndex !== index && active(s).hp > 0) {
    events.push({ t: "msg", text: `¡${player} retiró a ${getPokemonMetadata(active(s).id).name.toUpperCase()}!` });
  }
  s.activeIndex = index;
  // Gen II: al cambiar se pierden stages, confusión y demás volátiles;
  // el Tóxico vuelve a veneno normal.
  Object.assign(s, freshVolatile());
  const mon = active(s);
  if (mon.status?.type === "badly-poisoned") {
    mon.status = { type: "poison", turns: 1 };
  }
  events.push({ t: "switch", side, index });
  events.push({ t: "msg", text: `¡${player} sacó a ${getPokemonMetadata(mon.id).name.toUpperCase()}!` });
};

// ── Daño residual de final de turno ───────────────────────────────────────
const endOfTurn = (
  sim: LinkBattleSim,
  side: LinkRole,
  events: LinkBattleEvent[]
) => {
  const s = sim[side];
  const mon = active(s);
  if (mon.hp <= 0) return;
  const maxHp = getPokemonStats(mon.id, mon.level).hp;
  if (mon.status?.type === "poison" || mon.status?.type === "badly-poisoned") {
    mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(maxHp / 8)));
    events.push({ t: "msg", text: `¡${tag(sim, side)} sufre por el veneno!` });
    events.push({ t: "hp", side, hp: mon.hp });
  } else if (mon.status?.type === "burn") {
    mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(maxHp / 8)));
    events.push({ t: "msg", text: `¡${tag(sim, side)} sufre por la quemadura!` });
    events.push({ t: "hp", side, hp: mon.hp });
  }
  if (s.reflectTurns > 0) s.reflectTurns -= 1;
  if (s.lightScreenTurns > 0) s.lightScreenTurns -= 1;
};

/** ¿Se debilitó el activo de un bando? Emite el evento y lo señala. */
const checkFaint = (
  sim: LinkBattleSim,
  side: LinkRole,
  events: LinkBattleEvent[],
  fainted: { host: boolean; guest: boolean }
) => {
  if (!fainted[side] && active(sim[side]).hp <= 0) {
    fainted[side] = true;
    events.push({ t: "msg", text: `¡${tag(sim, side)} se debilitó!` });
    events.push({ t: "faint", side });
  }
};

// ── Resolución de un turno completo (solo la ejecuta el host) ─────────────
export const resolveLinkTurn = (
  sim: LinkBattleSim,
  actions: { host: LinkBattleAction; guest: LinkBattleAction }
): LinkTurnOutcome => {
  const events: LinkBattleEvent[] = [];
  const fainted = { host: false, guest: false };

  // Consumir el escudo de Protect del turno anterior.
  (["host", "guest"] as LinkRole[]).forEach((side) => {
    sim[side].protectedNow = false;
    sim[side].usedProtectThisTurn = false;
  });

  // 1. Cambios primero (Gen II: el cambio siempre va antes que los ataques).
  (["host", "guest"] as LinkRole[]).forEach((side) => {
    const action = actions[side];
    if (action.type === "switch") {
      performSwitch(sim, side, action.index, events);
    }
  });

  // 2. Ataques por prioridad y velocidad.
  const movers = (["host", "guest"] as LinkRole[]).filter(
    (side) => actions[side].type === "move"
  );
  movers.sort((a, b) => {
    const moveA = (actions[a] as { moveId: string }).moveId;
    const moveB = (actions[b] as { moveId: string }).moveId;
    const prioA = getMoveMetadata(moveA)?.priority ?? 0;
    const prioB = getMoveMetadata(moveB)?.priority ?? 0;
    if (prioA !== prioB) return prioB - prioA;
    const speedDiff = effectiveSpeed(sim[b]) - effectiveSpeed(sim[a]);
    if (speedDiff !== 0) return speedDiff;
    return Math.random() < 0.5 ? -1 : 1;
  });

  for (const side of movers) {
    if (fainted.host || fainted.guest) break; // un KO corta el turno (Gen I/II)
    if (active(sim[side]).hp <= 0) continue;
    performMove(sim, side, (actions[side] as { moveId: string }).moveId, events);
    checkFaint(sim, "host", events, fainted);
    checkFaint(sim, "guest", events, fainted);
  }

  // 3. Residuales de final de turno.
  if (!fainted.host && !fainted.guest) {
    (["host", "guest"] as LinkRole[]).forEach((side) => {
      endOfTurn(sim, side, events);
      checkFaint(sim, "host", events, fainted);
      checkFaint(sim, "guest", events, fainted);
    });
  }

  // Reset del streak de Protect si este turno no se usó.
  (["host", "guest"] as LinkRole[]).forEach((side) => {
    if (!sim[side].usedProtectThisTurn) sim[side].protectStreak = 0;
    sim[side].flinched = false;
  });

  // 4. ¿Ganador?
  const hostAlive = hasAlive(sim.host);
  const guestAlive = hasAlive(sim.guest);
  let winner: LinkRole | "draw" | null = null;
  if (!hostAlive && !guestAlive) winner = "draw";
  else if (!hostAlive) winner = "guest";
  else if (!guestAlive) winner = "host";

  return {
    events,
    needSwitch: {
      host: winner === null && fainted.host,
      guest: winner === null && fainted.guest,
    },
    winner,
  };
};
