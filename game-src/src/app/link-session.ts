// ─────────────────────────────────────────────────────────────────────────
// Club Cable (Gen II) — cliente de la Edge Function `link-session`.
//
// Sincroniza combates EN VIVO e intercambios entre invitados mediante
// polling (~2 s). Toda llamada incluye la identidad del jugador + su
// write_token (prueba de posesión, igual que save-game).
// ─────────────────────────────────────────────────────────────────────────
import { callEdge, getCurrentUserId, getWriteToken } from "./cloud-save";
import { PokemonInstance } from "../state/state-types";

export type LinkKind = "battle" | "trade";
export type LinkRole = "host" | "guest";

/** Acción de combate enviada por cada bando en la fase "choosing". */
export type LinkBattleAction =
  | { type: "move"; moveId: string }
  | { type: "switch"; index: number }
  | { type: "item"; item: string; targetIndex: number }
  | { type: "wait" } // el rival debe sacar un Pokémon tras un KO; yo espero
  | { type: "forfeit" };

/** Pistas que el host publica para que cada cliente bloquee en su UI lo que
 *  el motor rechazaría (Mal de Ojo, Bis, Inhabilitar). */
export interface LinkSideHints {
  /** Mal de Ojo / Red Viva: no se puede cambiar de Pokémon. */
  trapped: boolean;
  /** Bis activo: el próximo "Luchar" repite este movimiento. */
  encoreMove: string | null;
  /** Movimiento inhabilitado por Disable. */
  disabledMove: string | null;
}

/** Eventos que el host emite al resolver un turno; ambos visores los animan. */
export type LinkBattleEvent =
  | { t: "msg"; text: string }
  | { t: "anim"; side: LinkRole; moveId: string }
  | { t: "hp"; side: LinkRole; hp: number }
  | { t: "status"; side: LinkRole; status: { type: string; turns: number } | null }
  | { t: "switch"; side: LinkRole; index: number }
  | { t: "faint"; side: LinkRole };

export interface LinkResolution {
  turn: number;
  events: LinkBattleEvent[];
  hostParty: PokemonInstance[];
  guestParty: PokemonInstance[];
  hostActiveIndex: number;
  guestActiveIndex: number;
  /** Quién debe sacar Pokémon en el próximo turno (tras un KO). */
  needSwitch: { host: boolean; guest: boolean };
  winner: LinkRole | "draw" | null;
  /** Estado de bando para la UI (opcional: resoluciones antiguas no lo traen). */
  sideHints?: { host: LinkSideHints; guest: LinkSideHints };
}

export interface LinkSession {
  id: string;
  kind: LinkKind;
  status: "waiting" | "active" | "finished" | "cancelled";
  phase: string;
  turn: number;
  hostId: string;
  guestId: string | null;
  hostName: string;
  guestName: string | null;
  hostParty: PokemonInstance[];
  guestParty: PokemonInstance[] | null;
  hostAction: LinkBattleAction | null;
  guestAction: LinkBattleAction | null;
  resolution: LinkResolution | null;
  winner: LinkRole | "draw" | null;
  endReason: string | null;
  hostOffer: number | null;
  guestOffer: number | null;
  hostConfirm: boolean;
  guestConfirm: boolean;
  deadlineAt: string;
}

export interface WaitingRoom {
  sessionId: string;
  hostName: string;
}

/** Error tipado para que la UI distinga fallos de red de rechazos lógicos. */
export class LinkSessionError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

// deno reasons aside, la fila llega snake_case desde Postgres.
// deno-lint-ignore no-explicit-any
const mapSession = (row: any): LinkSession => ({
  id: row.id,
  kind: row.kind,
  status: row.status,
  phase: row.phase,
  turn: row.turn,
  hostId: row.host_id,
  guestId: row.guest_id ?? null,
  hostName: row.host_name ?? "Invitado",
  guestName: row.guest_name ?? null,
  hostParty: row.host_party ?? [],
  guestParty: row.guest_party ?? null,
  hostAction: row.host_action ?? null,
  guestAction: row.guest_action ?? null,
  resolution: row.resolution ?? null,
  winner: row.winner ?? null,
  endReason: row.end_reason ?? null,
  hostOffer: row.host_offer ?? null,
  guestOffer: row.guest_offer ?? null,
  hostConfirm: !!row.host_confirm,
  guestConfirm: !!row.guest_confirm,
  deadlineAt: row.deadline_at,
});

const call = async (
  action: string,
  params: Record<string, unknown> = {}
  // deno-lint-ignore no-explicit-any
): Promise<any> => {
  const userId = getCurrentUserId();
  const writeToken = getWriteToken();
  if (!userId || !writeToken) throw new LinkSessionError("NO_IDENTITY");
  const res = await callEdge("link-session", {
    action,
    userId,
    writeToken,
    ...params,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new LinkSessionError(data?.error ?? `HTTP_${res.status}`);
  return data;
};

export const linkCreate = async (kind: LinkKind): Promise<LinkSession> =>
  mapSession((await call("create", { kind })).session);

export const linkList = async (kind: LinkKind): Promise<WaitingRoom[]> =>
  (await call("list", { kind })).sessions ?? [];

export const linkJoin = async (sessionId: string): Promise<LinkSession> =>
  mapSession((await call("join", { sessionId })).session);

/** Mi sesión viva (si la hay) — para reanudar tras recargar la app. */
export const linkMine = async (): Promise<LinkSession | null> => {
  const { session } = await call("mine");
  return session ? mapSession(session) : null;
};

export const linkPoll = async (sessionId: string): Promise<LinkSession> =>
  mapSession((await call("poll", { sessionId })).session);

export const linkAct = async (
  sessionId: string,
  payload: { type: string; [k: string]: unknown }
): Promise<LinkSession> =>
  mapSession((await call("act", { sessionId, payload })).session);

export const linkResolve = async (
  sessionId: string,
  resolution: LinkResolution
): Promise<LinkSession> =>
  mapSession((await call("resolve", { sessionId, resolution })).session);

export const linkCancel = async (sessionId: string): Promise<void> => {
  try {
    await call("cancel", { sessionId });
  } catch {
    // Abandonar nunca debe romper la UI; el servidor adjudicará por timeout.
  }
};

/** Segundos restantes hasta el deadline de la fase (para el contador). */
export const secondsLeft = (session: LinkSession): number =>
  Math.max(
    0,
    Math.round((new Date(session.deadlineAt).getTime() - Date.now()) / 1000)
  );
