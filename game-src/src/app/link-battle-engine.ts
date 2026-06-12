// ─────────────────────────────────────────────────────────────────────────
// Motor de combate de enlace (Club Cable, Gen II).
//
// En un combate EN VIVO los dos jugadores eligen acción; el ANFITRIÓN
// (host) resuelve el turno completo con este motor (reutilizando el
// `processMove` del combate normal) y publica una lista de eventos
// serializables. Ambos visores (LinkBattleRoom) reproducen esos eventos,
// así que NUNCA hay desincronización: el guest no calcula nada.
//
// Reglas del Coliseo:
//   · Los Pokémon entran tal y como están (PS y estado actuales).
//   · Objetos de mochila permitidos (consumen el turno, como en combate
//     normal); las pokéballs están bloqueadas, como contra un entrenador.
//   · Los objetos equipados funcionan en AMBOS bandos.
//   · Huir = rendirse (con doble confirmación en la UI).
//   · El combate usa COPIAS: al terminar, el equipo real queda intacto.
//
// Mensajes: los nombres de Pokémon van como tokens `[[side|NOMBRE]]` y cada
// visor los traduce a "NOMBRE" (los míos) o "NOMBRE rival" (los del otro),
// igual que en el combate normal. Usar `formatLinkText` para renderizar.
//
// Limitaciones documentadas (v1): sin Bide (cae a "no pasó nada"); los
// moves de carga (Rayo Solar...) gastan su turno de carga como en el
// original; Roar/Whirlwind no fuerzan cambio (como en enlaces de Gen I).
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
import { ItemType } from "./use-item-data";
import {
  HP_BERRIES,
  HP_BERRY_THRESHOLD,
  LEFTOVERS_FRACTION,
  QUICK_CLAW_CHANCE,
  berryCuresStatus,
  curesConfusion,
} from "./held-item-helper";
import {
  BattleStatus,
  PokemonEncounterType,
  PokemonInstance,
  StatusType,
} from "../state/state-types";
import {
  LinkBattleAction,
  LinkBattleEvent,
  LinkRole,
  LinkSideHints,
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
};

const WEATHER_START_MSG: Record<"rain" | "sun" | "sandstorm", string> = {
  rain: "¡Empezó a llover!",
  sun: "¡El sol calienta con fuerza!",
  sandstorm: "¡Se desató una tormenta de arena!",
};

const TRAP_MSG = (move: string | null, name: string): string => {
  switch (move) {
    case "fire-spin":  return `¡${name} está envuelto en el Giro Fuego!`;
    case "bind":       return `¡${name} está siendo oprimido por Constricción!`;
    case "wrap":       return `¡${name} está apretado por Constricción!`;
    case "clamp":      return `¡${name} está atrapado por las Tenazas!`;
    case "whirlpool":  return `¡${name} está atrapado en el Torbellino!`;
    default:           return `¡${name} está atrapado!`;
  }
};

export type LinkWeather = { type: "rain" | "sun" | "sandstorm"; turns: number };

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
  enduringNow: boolean;
  focusEnergy: boolean;
  reflectTurns: number;
  lightScreenTurns: number;
  lastPhysicalDamageTaken: number;
  lastSpecialDamageTaken: number;
  hyperBeamRecharge: boolean;
  chargingMove: string | null;
  usedProtectThisTurn: boolean;
  // ── Paridad con el combate normal ──────────────────────────────────────
  leechSeeded: boolean;
  /** Atrapado por el rival (Wrap/Bind/...): turnos restantes de daño. */
  trappedTurns: number;
  trapMove: string | null;
  nightmare: boolean;
  perishCount: number | null;
  /** Púas en el SUELO de este bando (dañan a quien entra). */
  spikes: boolean;
  encore: { move: string; turns: number } | null;
  disabledMove: string | null;
  disabledTurns: number;
  lockOn: boolean;
  safeguardTurns: number;
  /** PS del Sustituto (0 = sin sustituto). */
  subHp: number;
  /** Premonición pendiente SOBRE este bando. */
  futureSight: { damage: number; turns: number } | null;
  /** Mal de Ojo / Red Viva: este bando no puede cambiar de Pokémon. */
  noEscape: boolean;
  lastMoveId: string | null;
  consecHits: number;
  /** Conversión / Conversión2: tipos override del activo. */
  convertedTypes: string[] | null;
  /** Transformación (Ditto): id y moves copiados del rival. */
  transformedId: number | null;
}

export interface LinkBattleSim {
  host: LinkSideState;
  guest: LinkSideState;
  names: { host: string; guest: string };
  weather: LinkWeather | null;
}

export interface LinkTurnOutcome {
  events: LinkBattleEvent[];
  needSwitch: { host: boolean; guest: boolean };
  winner: LinkRole | "draw" | null;
}

/** Volátiles que se pierden al cambiar de Pokémon (Gen II). Las Púas, el
 *  Velo Sagrado y la Premonición pendiente son de BANDO y persisten. */
const freshVolatile = () => ({
  stages: { ...DEFAULT_STAGES },
  confusionTurns: 0,
  flinched: false,
  attracted: false,
  protectedNow: false,
  protectStreak: 0,
  enduringNow: false,
  focusEnergy: false,
  reflectTurns: 0,
  lightScreenTurns: 0,
  hyperBeamRecharge: false,
  chargingMove: null,
  usedProtectThisTurn: false,
  leechSeeded: false,
  trappedTurns: 0,
  trapMove: null,
  nightmare: false,
  perishCount: null as number | null,
  encore: null as { move: string; turns: number } | null,
  disabledMove: null as string | null,
  disabledTurns: 0,
  lockOn: false,
  subHp: 0,
  noEscape: false,
  lastMoveId: null as string | null,
  consecHits: 0,
  convertedTypes: null as string[] | null,
  transformedId: null as number | null,
});

const makeSide = (party: PokemonInstance[]): LinkSideState => ({
  party: party.map((p) => ({ ...p, moves: p.moves.map((m) => ({ ...m })) })),
  activeIndex: Math.max(0, party.findIndex((p) => p.hp > 0)),
  lastPhysicalDamageTaken: 0,
  lastSpecialDamageTaken: 0,
  spikes: false,
  safeguardTurns: 0,
  futureSight: null,
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
  weather: null,
});

const other = (side: LinkRole): LinkRole =>
  side === "host" ? "guest" : "host";

const active = (s: LinkSideState): PokemonInstance => s.party[s.activeIndex];

const hasAlive = (s: LinkSideState): boolean => s.party.some((p) => p.hp > 0);

/** Id "visible" del activo (Transformación cambia sprite y stats de combate,
 *  pero el HP máximo sigue siendo el del Pokémon original). */
const activeBattleId = (s: LinkSideState): number =>
  s.transformedId ?? active(s).id;

const maxHpOf = (s: LinkSideState): number => {
  const mon = active(s);
  return getPokemonStats(mon.id, mon.level).hp;
};

/** Token de nombre relativo: cada visor lo convierte en "X" o "X rival". */
const tag = (sim: LinkBattleSim, side: LinkRole): string =>
  `[[${side}|${getPokemonMetadata(activeBattleId(sim[side])).name.toUpperCase()}]]`;

const tagOf = (side: LinkRole, pokemonId: number): string =>
  `[[${side}|${getPokemonMetadata(pokemonId).name.toUpperCase()}]]`;

/**
 * Convierte los tokens `[[side|NOMBRE]]` de los mensajes del host en texto
 * relativo al espectador: sus Pokémon a secas, los del rival con "rival"
 * (mismo formato que el combate contra NPCs).
 */
export const formatLinkText = (text: string, myRole: LinkRole): string =>
  text.replace(/\[\[(host|guest)\|([^\]]*)\]\]/g, (_, side, name) =>
    side === myRole ? name : `${name} rival`
  );

const effectiveSpeed = (sim: LinkBattleSim, side: LinkRole): number => {
  const s = sim[side];
  const mon = active(s);
  let speed = getPokemonStats(activeBattleId(s), mon.level).speed *
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
        const stats = getPokemonStats(activeBattleId(s), mon.level);
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
    // El Sustituto bloquea las bajadas de stats del rival (Gen II).
    if (target !== "attacker" && s.subHp > 0 && delta < 0) continue;
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

// ── Estado persistente con todas sus reglas (Velo Sagrado, bayas, Tóxico) ──
const applyLinkStatus = (
  sim: LinkBattleSim,
  attackerSide: LinkRole,
  statusApply: NonNullable<MoveResult["statusApply"]>,
  events: LinkBattleEvent[]
) => {
  const targetSide =
    statusApply.target === "attacker" ? attackerSide : other(attackerSide);
  const target = sim[targetSide];
  const targetMon = active(target);

  // Drenadoras es volátil, no un estado persistente.
  if (statusApply.status === "leech-seed") {
    if (!target.leechSeeded) {
      target.leechSeeded = true;
      events.push({
        t: "msg",
        text: `¡${tag(sim, targetSide)} fue sembrado con Drenadoras!`,
      });
    }
    return;
  }

  // Velo Sagrado: bloquea los estados infligidos por el rival.
  if (targetSide !== attackerSide && target.safeguardTurns > 0) return;
  // El Sustituto bloquea los estados infligidos por el rival.
  if (targetSide !== attackerSide && target.subHp > 0) return;

  if (targetMon.status && !statusApply.force) return;

  const newStatus: BattleStatus = {
    type: statusApply.status as BattleStatus["type"],
    turns:
      statusApply.fixedTurns !== undefined
        ? statusApply.fixedTurns
        : statusApply.status === "sleep"
        ? 1 + Math.floor(Math.random() * 6)
        : 1, // para Tóxico, `turns` es el contador creciente de daño
  };
  targetMon.status = newStatus;
  events.push({
    t: "msg",
    text: `¡${tag(sim, targetSide)} ${STATUS_MSG[newStatus.type] ?? "cambió de estado"}!`,
  });
  events.push({ t: "status", side: targetSide, status: newStatus });
};

// ── Objetos de mochila (acción "item") ─────────────────────────────────────
type LinkItemSpec =
  | { name: string; kind: "heal"; amount: number | "full"; confuseSelf?: boolean }
  | { name: string; kind: "status-cure"; cures: StatusType[] }
  | { name: string; kind: "revive"; fraction: number }
  | { name: string; kind: "pp"; amount: number | "full" };

const ALL_STATUS: StatusType[] = [
  "poison",
  "badly-poisoned",
  "burn",
  "paralysis",
  "sleep",
  "freeze",
];

/** Efectos de los objetos usables en el Coliseo (espejo de use-item-data). */
const LINK_ITEM_EFFECTS: Partial<Record<ItemType, LinkItemSpec>> = {
  [ItemType.Potion]: { name: "Poción", kind: "heal", amount: 20 },
  [ItemType.SuperPotion]: { name: "Superpoción", kind: "heal", amount: 50 },
  [ItemType.HyperPotion]: { name: "Hiperpoción", kind: "heal", amount: 200 },
  [ItemType.MaxPotion]: { name: "Poción Máx.", kind: "heal", amount: "full" },
  [ItemType.FreshWater]: { name: "Agua Fresca", kind: "heal", amount: 50 },
  [ItemType.SodaPop]: { name: "Soda", kind: "heal", amount: 60 },
  [ItemType.Lemondade]: { name: "Limonada", kind: "heal", amount: 80 },
  [ItemType.VinoMonjardin]: {
    name: "Vino Monjardín",
    kind: "heal",
    amount: 40,
    confuseSelf: true,
  },
  [ItemType.Berry]: { name: "Baya", kind: "heal", amount: 10 },
  [ItemType.GoldBerry]: { name: "Baya Dorada", kind: "heal", amount: 30 },
  [ItemType.Antidote]: { name: "Antídoto", kind: "status-cure", cures: ["poison", "badly-poisoned"] },
  [ItemType.PrzCureBerry]: { name: "Baya Antipar", kind: "status-cure", cures: ["paralysis"] },
  [ItemType.PsnCureBerry]: { name: "Baya Antitóx", kind: "status-cure", cures: ["poison", "badly-poisoned"] },
  [ItemType.MintBerry]: { name: "Baya Menta", kind: "status-cure", cures: ["sleep"] },
  [ItemType.IceBerry]: { name: "Baya Hielo", kind: "status-cure", cures: ["burn"] },
  [ItemType.BurntBerry]: { name: "Baya Tostada", kind: "status-cure", cures: ["freeze"] },
  [ItemType.MiracleBerry]: { name: "Baya Milagro", kind: "status-cure", cures: ALL_STATUS },
  [ItemType.Revive]: { name: "Revivir", kind: "revive", fraction: 0.5 },
  [ItemType.MaxRevive]: { name: "Revivir Máx.", kind: "revive", fraction: 1 },
  [ItemType.Ether]: { name: "Éter", kind: "pp", amount: 10 },
  [ItemType.MaxEther]: { name: "Éter Máx.", kind: "pp", amount: "full" },
  [ItemType.Elixer]: { name: "Elixir", kind: "pp", amount: 10 },
  [ItemType.MaxElixer]: { name: "Elixir Máx.", kind: "pp", amount: "full" },
  [ItemType.MysteryBerry]: { name: "Baya Misterio", kind: "pp", amount: 5 },
  [ItemType.PpUp]: { name: "PS Más", kind: "pp", amount: 10 },
};

/** ¿Puede usarse este objeto en el Coliseo? (la UI también lo pre-valida). */
export const linkItemUsable = (item: string): boolean =>
  !!LINK_ITEM_EFFECTS[item as ItemType];

/** Pre-validación de objetivo para la UI: null = válido; si no, el aviso a
 *  mostrar (el objeto NO se consume si la UI rechaza aquí). */
export const linkItemTargetError = (
  item: string,
  target: PokemonInstance
): string | null => {
  const spec = LINK_ITEM_EFFECTS[item as ItemType];
  if (!spec) return "¡Éste no es el momento de usarlo!";
  const maxHp = getPokemonStats(target.id, target.level).hp;
  if (spec.kind === "heal") {
    if (target.hp <= 0) return "¡No tendría efecto!";
    if (target.hp >= maxHp) return "¡Tiene los PS al máximo!";
    return null;
  }
  if (spec.kind === "status-cure") {
    if (!target.status || !spec.cures.includes(target.status.type))
      return "¡No tendría efecto!";
    return null;
  }
  if (spec.kind === "revive") {
    return target.hp > 0 ? "¡No tendría efecto!" : null;
  }
  return null; // pp: siempre aplicable
};

const performItem = (
  sim: LinkBattleSim,
  side: LinkRole,
  item: string,
  targetIndex: number,
  events: LinkBattleEvent[]
) => {
  const s = sim[side];
  const player = sim.names[side].toUpperCase();
  const spec = LINK_ITEM_EFFECTS[item as ItemType];
  if (!spec || targetIndex < 0 || targetIndex >= s.party.length) {
    events.push({ t: "msg", text: `¡${player} usó un objeto, pero no pasó nada!` });
    return;
  }
  const target = s.party[targetIndex];
  const targetName = tagOf(side, target.id);
  const targetMax = getPokemonStats(target.id, target.level).hp;
  const isActive = targetIndex === s.activeIndex;
  const emitHp = () => {
    if (isActive) events.push({ t: "hp", side, hp: target.hp });
  };

  events.push({ t: "msg", text: `¡${player} usó ${spec.name.toUpperCase()}!` });

  if (spec.kind === "heal") {
    if (target.hp <= 0 || target.hp >= targetMax) {
      events.push({ t: "msg", text: "¡Pero no tuvo efecto!" });
      return;
    }
    target.hp = Math.min(
      targetMax,
      target.hp + (spec.amount === "full" ? targetMax : spec.amount)
    );
    emitHp();
    events.push({ t: "msg", text: `¡${targetName} recuperó PS!` });
    if (spec.confuseSelf && isActive && s.confusionTurns === 0) {
      s.confusionTurns = 2 + Math.floor(Math.random() * 4);
      events.push({ t: "msg", text: `¡${targetName} se mareó y quedó confundido!` });
    }
    return;
  }

  if (spec.kind === "status-cure") {
    if (!target.status || !spec.cures.includes(target.status.type)) {
      events.push({ t: "msg", text: "¡Pero no tuvo efecto!" });
      return;
    }
    target.status = null;
    if (isActive) events.push({ t: "status", side, status: null });
    events.push({ t: "msg", text: `¡${targetName} se recuperó de su estado!` });
    return;
  }

  if (spec.kind === "revive") {
    if (target.hp > 0) {
      events.push({ t: "msg", text: "¡Pero no tuvo efecto!" });
      return;
    }
    target.hp = Math.max(1, Math.round(targetMax * spec.fraction));
    target.status = null;
    emitHp();
    events.push({ t: "msg", text: `¡${targetName} revivió!` });
    return;
  }

  // pp
  target.moves = target.moves.map((m) => ({
    ...m,
    pp: Math.min(
      getMoveMetadata(m.id)?.pp || 0,
      spec.amount === "full"
        ? getMoveMetadata(m.id)?.pp || 0
        : m.pp + spec.amount
    ),
  }));
  events.push({ t: "msg", text: `¡${targetName} recuperó PP!` });
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
  let atkMon = active(attacker);
  const defMon = active(defender);
  const atkName = tag(sim, side);
  const defName = tag(sim, other(side));

  // Recarga de Hiperrayo: pierde el turno.
  if (attacker.hyperBeamRecharge) {
    attacker.hyperBeamRecharge = false;
    events.push({ t: "msg", text: `¡${atkName} debe recargar energía!` });
    return;
  }

  // Bis (Encore): obligado a repetir su último movimiento.
  if (attacker.encore && attacker.encore.turns > 0) {
    moveId = attacker.encore.move;
  }

  // Movimiento inhabilitado (Disable): pierde el turno.
  if (attacker.disabledMove && moveId === attacker.disabledMove) {
    const meta = getMoveMetadata(moveId);
    events.push({
      t: "msg",
      text: `¡${(meta?.name ?? moveId).toUpperCase()} de ${atkName} está inhabilitado!`,
    });
    return;
  }

  // Movimiento de carga (Rayo Solar...): primer turno carga, segundo dispara.
  // Con sol, Rayo Solar dispara sin turno de carga (Gen II).
  if (attacker.chargingMove) {
    moveId = attacker.chargingMove;
    attacker.chargingMove = null;
  } else if (
    isChargeMove(moveId) &&
    !(moveId === "solar-beam" && sim.weather?.type === "sun")
  ) {
    attacker.chargingMove = moveId;
    events.push({ t: "msg", text: `¡${atkName} usó ${getMoveMetadata(moveId).name.toUpperCase()}!` });
    events.push({
      t: "msg",
      text: CHARGE_MESSAGE[moveId]
        ? CHARGE_MESSAGE[moveId].replace("{user}", atkName)
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
    id: activeBattleId(defender),
    level: defMon.level,
    hp: defMon.hp,
    moves: defMon.moves.map((m) => m.id),
    gender: defMon.gender,
  };

  const attackerForMove: PokemonInstance =
    attacker.transformedId !== null
      ? { ...atkMon, id: attacker.transformedId }
      : atkMon;

  const context: MoveContext = {
    lastPhysicalDamageTaken: attacker.lastPhysicalDamageTaken,
    lastSpecialDamageTaken: attacker.lastSpecialDamageTaken,
    isTargetSleeping: defMon.status?.type === "sleep",
    attackerStatus: atkMon.status?.type ?? null,
    attackerOverrideTypes: attacker.convertedTypes ?? undefined,
    defenderIsProtected: defender.protectedNow,
    defenderIsEnduring: defender.enduringNow,
    attackerHasFocusEnergy: attacker.focusEnergy,
    attackerHeldItem: atkMon.heldItem ?? null,
    defenderHeldItem: defMon.heldItem ?? null,
    defenderHasReflect: defender.reflectTurns > 0,
    defenderHasLightScreen: defender.lightScreenTurns > 0,
    defenderHasSubstitute: defender.subHp > 0,
    defenderSubHp: defender.subHp > 0 ? defender.subHp : undefined,
    attackerBaseSpeed: getPokemonMetadata(activeBattleId(attacker)).baseStats.speed,
    weather: sim.weather?.type ?? null,
    guaranteedHit: attacker.lockOn,
    defenderLastMoveId: defender.lastMoveId,
    attackerConsecutiveHits: attacker.consecHits,
    defenderHasSafeguard: defender.safeguardTurns > 0,
  };

  const result = processMove(
    attackerForMove,
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

  // Registro del último move (Encore / Disable / Mirror Move / Conversión2)
  // y consumo de Fijar Blanco.
  attacker.lastMoveId = moveId;
  if (result.isLockOn) {
    // se activa más abajo
  } else {
    attacker.lockOn = false;
  }
  // Rampa de Rodar / Corte Furia.
  if (moveId === "rollout" || moveId === "fury-cutter") {
    attacker.consecHits = result.missed ? 0 : attacker.consecHits + 1;
  } else {
    attacker.consecHits = 0;
  }

  // Propagar PP/HP del atacante (drain y recoil ya vienen aplicados en `us`).
  // Con Transformación conservamos el id original del Pokémon real.
  const prevAtkHp = atkMon.hp;
  attacker.party[attacker.activeIndex] = {
    ...result.us,
    id: atkMon.id,
  };
  atkMon = attacker.party[attacker.activeIndex];

  if (result.missed) {
    events.push({ t: "msg", text: `¡${atkName} falló!` });
    // Patada Salto / Patada Salto Alta: 1 PS de daño al fallar.
    if (atkMon.hp !== prevAtkHp) {
      events.push({ t: "hp", side, hp: atkMon.hp });
    }
    return;
  }

  events.push({ t: "anim", side, moveId });

  // ── Sustituto del defensor: absorbe el daño ──────────────────────────────
  if (result.blockedBySub) {
    events.push({ t: "msg", text: "¡El sustituto bloqueó el ataque!" });
    return;
  }
  if (result.subDamage && defender.subHp > 0) {
    defender.subHp -= result.subDamage;
    if (defender.subHp <= 0) {
      defender.subHp = 0;
      events.push({ t: "msg", text: `¡El SUSTITUTO de ${defName} se rompió!` });
    } else {
      events.push({ t: "msg", text: `¡El SUSTITUTO encajó el golpe!` });
    }
  }

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
  if (result.isNoEffect || result.isBide || result.forceFlee) {
    // Bide y Roar/Whirlwind no tienen efecto en combates de enlace.
    events.push({ t: "msg", text: "¡Pero no pasó nada!" });
  }
  if (result.enduredHit) {
    events.push({ t: "msg", text: `¡${defName} aguantó el golpe!` });
  }
  if (result.focusBandSaved) {
    events.push({ t: "msg", text: `¡${defName} resistió con su CINTA FOCUS!` });
  }
  if (result.payDayCoins) {
    events.push({ t: "msg", text: "¡Monedas esparcidas por todas partes!" });
  }

  // Drain / recoil: el HP de `us` ya cambió; solo narramos.
  if (result.drainHeal && result.drainHeal > 0) {
    events.push({ t: "msg", text: `¡${atkName} recuperó energía!` });
  } else if (result.drainHeal && result.drainHeal < 0) {
    events.push({ t: "msg", text: `¡${atkName} se hirió por el retroceso!` });
  }
  if (atkMon.hp !== prevAtkHp || result.drainHeal) {
    events.push({ t: "hp", side, hp: atkMon.hp });
  }

  // ── Transformación (Ditto) ───────────────────────────────────────────────
  if (result.isTransform) {
    attacker.transformedId = activeBattleId(defender);
    atkMon.moves = defMon.moves.map((m) => ({ id: m.id, pp: 5 }));
    attacker.stages = { ...defender.stages };
    events.push({
      t: "msg",
      text: `¡${tagOf(side, active(attacker).id)} se transformó en ${defName}!`,
    });
    return;
  }

  // Protect / Detect / Aguante comparten racha de éxito decreciente.
  if (result.isProtect || result.isEndure) {
    const succeeds =
      attacker.protectStreak === 0 ||
      Math.random() < 1 / Math.pow(2, attacker.protectStreak);
    if (succeeds) {
      attacker.usedProtectThisTurn = true;
      attacker.protectStreak += 1;
      if (result.isProtect) {
        attacker.protectedNow = true;
        events.push({ t: "msg", text: `¡${atkName} se protegió!` });
      } else {
        attacker.enduringNow = true;
        events.push({ t: "msg", text: `¡${atkName} se prepara para aguantar!` });
      }
    } else {
      attacker.protectStreak = 0;
      events.push({ t: "msg", text: `¡Pero falló!` });
    }
    return;
  }

  // Cambios de stats / estado / confusión / flinch / extras.
  applyStatChange(sim, side, result.statChange, events);

  if (result.statusApply) {
    applyLinkStatus(sim, side, result.statusApply, events);
  }

  if (
    result.confuse &&
    defender.confusionTurns === 0 &&
    defMon.status?.type !== "sleep" &&
    defender.safeguardTurns === 0 &&
    defender.subHp === 0
  ) {
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
  // ── Gen II: efectos de campo y volátiles nuevos ─────────────────────────
  if (result.startTrap) {
    defender.trappedTurns = result.startTrap.turns;
    defender.trapMove = result.startTrap.move;
  }
  if (result.isRapidSpin) {
    attacker.trappedTurns = 0;
    attacker.trapMove = null;
    attacker.leechSeeded = false;
    if (attacker.spikes) {
      attacker.spikes = false;
      events.push({ t: "msg", text: `¡${atkName} limpió las PÚAS de su suelo!` });
    }
  }
  if (result.startSubstitute) {
    attacker.subHp = result.startSubstitute.hp;
    events.push({ t: "msg", text: `¡${atkName} creó un SUSTITUTO!` });
  }
  if (result.startWeather) {
    sim.weather = { type: result.startWeather, turns: 5 };
    events.push({ t: "msg", text: WEATHER_START_MSG[result.startWeather] });
  }
  if (result.isEncore) {
    if (defender.lastMoveId) {
      defender.encore = {
        move: defender.lastMoveId,
        turns: 2 + Math.floor(Math.random() * 5),
      };
      events.push({ t: "msg", text: `¡${defName} recibió un BIS!` });
    } else {
      events.push({ t: "msg", text: "¡Pero falló!" });
    }
  }
  if (result.isNightmare) {
    if (defMon.status?.type === "sleep" && !defender.nightmare) {
      defender.nightmare = true;
      events.push({ t: "msg", text: `¡${defName} empezó a tener pesadillas!` });
    } else if (defMon.status?.type !== "sleep") {
      events.push({ t: "msg", text: "¡Pero falló!" });
    }
  }
  if (result.isPerishSong) {
    if (attacker.perishCount === null) attacker.perishCount = 3;
    if (defender.perishCount === null) defender.perishCount = 3;
    events.push({ t: "msg", text: "¡Quien oyó el CANTO MORTAL caerá en 3 turnos!" });
  }
  if (result.isSpikes) {
    if (!defender.spikes) {
      defender.spikes = true;
      events.push({ t: "msg", text: `¡El suelo de ${defName} se cubrió de PÚAS!` });
    } else {
      events.push({ t: "msg", text: "¡Pero falló!" });
    }
  }
  if (result.isNoEscape) {
    defender.noEscape = true;
    events.push({ t: "msg", text: `¡${defName} ya no puede escapar!` });
  }
  if (result.isLockOn) {
    attacker.lockOn = true;
    events.push({ t: "msg", text: `¡${atkName} fijó el blanco!` });
  }
  if (result.isSafeguard) {
    attacker.safeguardTurns = 5;
    events.push({ t: "msg", text: `¡Un velo místico protege a ${atkName}!` });
  }
  if (result.isConversion) {
    const pMoves = atkMon.moves;
    if (pMoves.length > 0) {
      const picked = pMoves[Math.floor(Math.random() * pMoves.length)];
      const pickedType = getMoveMetadata(picked.id)?.type ?? "normal";
      attacker.convertedTypes = [pickedType];
      events.push({ t: "msg", text: `¡${atkName} cambió a tipo ${pickedType.toUpperCase()}!` });
    }
  }
  if (result.conversion2Type) {
    attacker.convertedTypes = [result.conversion2Type];
    events.push({ t: "msg", text: `¡${atkName} cambió de tipo!` });
  }
  if (result.futureSightDamage) {
    if (!defender.futureSight) {
      defender.futureSight = { damage: result.futureSightDamage, turns: 2 };
      events.push({ t: "msg", text: `¡${atkName} previó un ataque!` });
    } else {
      events.push({ t: "msg", text: "¡Pero falló!" });
    }
  }
  if (result.isDisable) {
    if (defender.lastMoveId && !defender.disabledMove) {
      defender.disabledMove = defender.lastMoveId;
      defender.disabledTurns = 1 + Math.floor(Math.random() * 8);
      const meta = getMoveMetadata(defender.lastMoveId);
      events.push({
        t: "msg",
        text: `¡${(meta?.name ?? "El movimiento").toUpperCase()} de ${defName} quedó inhabilitado!`,
      });
    } else {
      events.push({ t: "msg", text: "¡Pero falló!" });
    }
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
  // Mal de Ojo / Red Viva: no puede cambiar (la UI ya lo bloquea; red de
  // seguridad del host). El cambio voluntario se convierte en turno perdido.
  if (s.noEscape && active(s).hp > 0) {
    events.push({ t: "msg", text: `¡${tag(sim, side)} no puede escapar!` });
    return;
  }
  const player = sim.names[side].toUpperCase();
  if (s.activeIndex !== index && active(s).hp > 0) {
    events.push({ t: "msg", text: `¡${player} retiró a ${getPokemonMetadata(activeBattleId(s)).name.toUpperCase()}!` });
  }
  s.activeIndex = index;
  // Gen II: al cambiar se pierden stages, confusión y demás volátiles;
  // el Tóxico vuelve a veneno normal. Las Púas, el Velo Sagrado y la
  // Premonición pendiente son de bando y persisten (spread tras el reset).
  const keepSpikes = s.spikes;
  const keepSafeguard = s.safeguardTurns;
  const keepFutureSight = s.futureSight;
  Object.assign(s, freshVolatile());
  s.spikes = keepSpikes;
  s.safeguardTurns = keepSafeguard;
  s.futureSight = keepFutureSight;
  // El Mal de Ojo que ESTE bando lanzó deja de atrapar al rival al retirarse.
  sim[other(side)].noEscape = false;
  const mon = active(s);
  if (mon.status?.type === "badly-poisoned") {
    mon.status = { type: "poison", turns: 1 };
  }
  events.push({ t: "switch", side, index });
  events.push({ t: "msg", text: `¡${player} sacó a ${getPokemonMetadata(mon.id).name.toUpperCase()}!` });
  // Púas: dañan al que entra (1/8, nunca por debajo de 1 PS).
  if (s.spikes && mon.hp > 0) {
    const maxHp = getPokemonStats(mon.id, mon.level).hp;
    const dmg = Math.max(1, Math.floor(maxHp / 8));
    mon.hp = Math.max(1, mon.hp - dmg);
    events.push({ t: "msg", text: `¡${tagOf(side, mon.id)} fue herido por las PÚAS!` });
    events.push({ t: "hp", side, hp: mon.hp });
  }
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

// ── Daño residual y objetos equipados de final de turno ───────────────────
const endOfTurn = (
  sim: LinkBattleSim,
  events: LinkBattleEvent[],
  fainted: { host: boolean; guest: boolean }
) => {
  const sides: LinkRole[] = ["host", "guest"];

  // 1. Veneno / Tóxico / quemadura (el contador del Tóxico crece).
  for (const side of sides) {
    const s = sim[side];
    const mon = active(s);
    if (mon.hp <= 0) continue;
    const maxHp = maxHpOf(s);
    const st = mon.status;
    if (st && (st.type === "poison" || st.type === "badly-poisoned" || st.type === "burn")) {
      const counter = st.type === "badly-poisoned" ? st.turns : 1;
      const dmg = Math.max(1, Math.floor((maxHp * counter) / 16));
      mon.hp = Math.max(0, mon.hp - dmg);
      if (st.type === "badly-poisoned") {
        mon.status = { ...st, turns: st.turns + 1 };
      }
      const what = st.type === "burn" ? "la quemadura" : "el veneno";
      events.push({ t: "msg", text: `¡${tag(sim, side)} sufre por ${what}!` });
      events.push({ t: "hp", side, hp: mon.hp });
    }
    checkFaint(sim, side, events, fainted);
  }

  // 2. Drenadoras: drena 1/16 y cura al activo rival.
  for (const side of sides) {
    const s = sim[side];
    const mon = active(s);
    if (!s.leechSeeded || mon.hp <= 0) continue;
    const o = sim[other(side)];
    const oMon = active(o);
    const dmg = Math.max(1, Math.floor(maxHpOf(s) / 16));
    mon.hp = Math.max(0, mon.hp - dmg);
    events.push({ t: "msg", text: `¡${tag(sim, side)} pierde PS por Drenadoras!` });
    events.push({ t: "hp", side, hp: mon.hp });
    if (oMon.hp > 0) {
      oMon.hp = Math.min(maxHpOf(o), oMon.hp + dmg);
      events.push({ t: "hp", side: other(side), hp: oMon.hp });
    }
    checkFaint(sim, side, events, fainted);
  }

  // 3. Trampas (Wrap/Bind/Giro Fuego/Tenazas/Torbellino): 1/16 por turno.
  for (const side of sides) {
    const s = sim[side];
    const mon = active(s);
    if (s.trappedTurns <= 0 || mon.hp <= 0) continue;
    const dmg = Math.max(1, Math.floor(maxHpOf(s) / 16));
    mon.hp = Math.max(0, mon.hp - dmg);
    s.trappedTurns -= 1;
    events.push({ t: "msg", text: TRAP_MSG(s.trapMove, tag(sim, side)) });
    events.push({ t: "hp", side, hp: mon.hp });
    if (s.trappedTurns <= 0) {
      s.trapMove = null;
      events.push({ t: "msg", text: `¡${tag(sim, side)} se liberó!` });
    }
    checkFaint(sim, side, events, fainted);
  }

  // 4. Reflejo / Pantalla Luz: contadores.
  for (const side of sides) {
    const s = sim[side];
    if (s.reflectTurns > 0) {
      s.reflectTurns -= 1;
      if (s.reflectTurns === 0) {
        events.push({ t: "msg", text: `¡El REFLEJO de ${tag(sim, side)} desapareció!` });
      }
    }
    if (s.lightScreenTurns > 0) {
      s.lightScreenTurns -= 1;
      if (s.lightScreenTurns === 0) {
        events.push({ t: "msg", text: `¡La PANTALLA LUZ de ${tag(sim, side)} desapareció!` });
      }
    }
  }

  // 5. Objetos equipados (ambos bandos llevan objetos en el Coliseo).
  for (const side of sides) {
    const s = sim[side];
    const mon = active(s);
    const heldItem = mon.heldItem ?? null;
    if (!heldItem || mon.hp <= 0) continue;
    const maxHp = maxHpOf(s);
    let berryConsumed = false;
    if (heldItem === ItemType.Leftovers && mon.hp < maxHp) {
      mon.hp = Math.min(maxHp, mon.hp + Math.max(1, Math.floor(maxHp * LEFTOVERS_FRACTION)));
      events.push({ t: "msg", text: `¡${tag(sim, side)} recuperó PS con sus RESTOS!` });
      events.push({ t: "hp", side, hp: mon.hp });
    }
    const berryHeal = HP_BERRIES[heldItem];
    if (berryHeal && mon.hp <= maxHp * HP_BERRY_THRESHOLD) {
      mon.hp = Math.min(maxHp, mon.hp + berryHeal);
      berryConsumed = true;
      events.push({ t: "msg", text: `¡${tag(sim, side)} se comió su BAYA y recuperó PS!` });
      events.push({ t: "hp", side, hp: mon.hp });
    }
    if (mon.status && berryCuresStatus(heldItem, mon.status.type)) {
      mon.status = null;
      berryConsumed = true;
      events.push({ t: "msg", text: `¡La BAYA de ${tag(sim, side)} curó su estado!` });
      events.push({ t: "status", side, status: null });
    }
    if (s.confusionTurns > 0 && curesConfusion(heldItem)) {
      s.confusionTurns = 0;
      berryConsumed = true;
      events.push({ t: "msg", text: `¡La BAYA de ${tag(sim, side)} curó su confusión!` });
    }
    if (berryConsumed) {
      mon.heldItem = null; // solo en la COPIA: el equipo real no pierde nada
    }
  }

  // 6. Pesadilla: ¼ por turno mientras duerma.
  for (const side of sides) {
    const s = sim[side];
    const mon = active(s);
    if (!s.nightmare) continue;
    if (mon.status?.type === "sleep" && mon.hp > 0) {
      mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(maxHpOf(s) / 4)));
      events.push({ t: "msg", text: `¡${tag(sim, side)} sufre pesadillas!` });
      events.push({ t: "hp", side, hp: mon.hp });
      checkFaint(sim, side, events, fainted);
    } else if (mon.status?.type !== "sleep") {
      s.nightmare = false;
    }
  }

  // 7. Premonición: golpea 2 turnos después de anunciarse.
  for (const side of sides) {
    const s = sim[side];
    const mon = active(s);
    if (!s.futureSight || mon.hp <= 0) continue;
    s.futureSight.turns -= 1;
    if (s.futureSight.turns <= 0) {
      mon.hp = Math.max(0, mon.hp - s.futureSight.damage);
      s.futureSight = null;
      events.push({ t: "msg", text: `¡${tag(sim, side)} fue alcanzado por PREMONICIÓN!` });
      events.push({ t: "hp", side, hp: mon.hp });
      checkFaint(sim, side, events, fainted);
    }
  }

  // 8. Canto Mortal: cuenta atrás de 3 (un KO doble termina en empate).
  for (const side of sides) {
    const s = sim[side];
    const mon = active(s);
    if (s.perishCount === null || mon.hp <= 0) continue;
    s.perishCount -= 1;
    if (s.perishCount <= 0) {
      mon.hp = 0;
      s.perishCount = null;
      events.push({ t: "msg", text: `¡La cuenta de ${tag(sim, side)} llegó a 0!` });
      events.push({ t: "hp", side, hp: 0 });
      checkFaint(sim, side, events, fainted);
    } else {
      events.push({ t: "msg", text: `Cuenta de ${tag(sim, side)}: ${s.perishCount}.` });
    }
  }

  // 9. Clima: daño de tormenta de arena y duración (5 turnos).
  if (sim.weather) {
    if (sim.weather.type === "sandstorm") {
      const IMMUNE = ["rock", "ground", "steel"];
      for (const side of sides) {
        const s = sim[side];
        const mon = active(s);
        if (mon.hp <= 0) continue;
        const types =
          s.convertedTypes ?? getPokemonMetadata(activeBattleId(s)).types;
        if (types.some((t) => IMMUNE.includes(t.toLowerCase()))) continue;
        mon.hp = Math.max(0, mon.hp - Math.max(1, Math.floor(maxHpOf(s) / 8)));
        events.push({ t: "msg", text: `¡La tormenta zarandea a ${tag(sim, side)}!` });
        events.push({ t: "hp", side, hp: mon.hp });
        checkFaint(sim, side, events, fainted);
      }
    }
    sim.weather.turns -= 1;
    if (sim.weather.turns <= 0) {
      sim.weather = null;
      events.push({ t: "msg", text: "El tiempo volvió a la normalidad." });
    }
  }

  // 10. Contadores de Bis, Velo Sagrado e Inhabilitar.
  for (const side of sides) {
    const s = sim[side];
    if (s.encore) {
      s.encore.turns -= 1;
      if (s.encore.turns <= 0) s.encore = null;
    }
    if (s.safeguardTurns > 0) s.safeguardTurns -= 1;
    if (s.disabledTurns > 0) {
      s.disabledTurns -= 1;
      if (s.disabledTurns <= 0) s.disabledMove = null;
    }
  }
};

/** Pistas de estado para la UI de cada cliente (bloquear cambio con Mal de
 *  Ojo, forzar el move del Bis, marcar el move inhabilitado). */
export const getSideHints = (
  sim: LinkBattleSim
): { host: LinkSideHints; guest: LinkSideHints } => {
  const hints = (side: LinkRole): LinkSideHints => ({
    trapped: sim[side].noEscape,
    encoreMove: sim[side].encore?.move ?? null,
    disabledMove: sim[side].disabledMove,
  });
  return { host: hints("host"), guest: hints("guest") };
};

// ── Resolución de un turno completo (solo la ejecuta el host) ─────────────
export const resolveLinkTurn = (
  sim: LinkBattleSim,
  actions: { host: LinkBattleAction; guest: LinkBattleAction }
): LinkTurnOutcome => {
  const events: LinkBattleEvent[] = [];
  const fainted = { host: false, guest: false };

  // Consumir el escudo de Protect/Aguante del turno anterior.
  (["host", "guest"] as LinkRole[]).forEach((side) => {
    sim[side].protectedNow = false;
    sim[side].enduringNow = false;
    sim[side].usedProtectThisTurn = false;
  });

  // 1. Cambios primero (Gen II: el cambio siempre va antes que los ataques).
  (["host", "guest"] as LinkRole[]).forEach((side) => {
    const action = actions[side];
    if (action.type === "switch") {
      performSwitch(sim, side, action.index, events);
      checkFaint(sim, side, events, fainted);
    }
  });

  // 2. Objetos de mochila (consumen el turno, como en combate normal).
  (["host", "guest"] as LinkRole[]).forEach((side) => {
    const action = actions[side];
    if (action.type === "item") {
      performItem(sim, side, action.item, action.targetIndex, events);
    }
  });

  // 3. Ataques por prioridad, Garra Rápida y velocidad.
  const movers = (["host", "guest"] as LinkRole[]).filter(
    (side) => actions[side].type === "move"
  );
  const quickClaw: Record<LinkRole, boolean> = {
    host:
      active(sim.host).heldItem === ItemType.QuickClaw &&
      Math.random() < QUICK_CLAW_CHANCE,
    guest:
      active(sim.guest).heldItem === ItemType.QuickClaw &&
      Math.random() < QUICK_CLAW_CHANCE,
  };
  movers.sort((a, b) => {
    const moveA = (actions[a] as { moveId: string }).moveId;
    const moveB = (actions[b] as { moveId: string }).moveId;
    const prioA = getMoveMetadata(moveA)?.priority ?? 0;
    const prioB = getMoveMetadata(moveB)?.priority ?? 0;
    if (prioA !== prioB) return prioB - prioA;
    if (quickClaw[a] !== quickClaw[b]) return quickClaw[a] ? -1 : 1;
    const speedDiff = effectiveSpeed(sim, b) - effectiveSpeed(sim, a);
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

  // 4. Residuales de final de turno.
  if (!fainted.host && !fainted.guest) {
    endOfTurn(sim, events, fainted);
  }

  // Reset del streak de Protect/Aguante si este turno no se usó.
  (["host", "guest"] as LinkRole[]).forEach((side) => {
    if (!sim[side].usedProtectThisTurn) sim[side].protectStreak = 0;
    sim[side].flinched = false;
  });

  // 5. ¿Ganador?
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
