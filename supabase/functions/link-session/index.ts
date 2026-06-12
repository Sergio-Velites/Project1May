// ─────────────────────────────────────────────────────────────────────────
// Club Cable (Gen II): combates EN VIVO e intercambios entre invitados.
//
// Única Edge Function con dispatch por `action` (igual presupuesto de cold
// start que varias, pero un solo deploy y una sola allowlist CORS):
//
//   create  { kind }                  → crea sala y espera rival
//   list    { kind }                  → salas en espera (para unirse)
//   join    { sessionId }             → unirse a una sala (atómico)
//   mine    {}                        → mi sesión viva (para reanudar tras recarga)
//   poll    { sessionId }             → estado + heartbeat + adjudicación
//   act     { sessionId, payload }    → acción del turno (combate/intercambio)
//   resolve { sessionId, resolution } → solo host: resultado del turno
//   cancel  { sessionId }             → abandonar (en combate activo = rendirse)
//
// Seguridad: toda petición exige { userId, writeToken } y se valida contra
// saves.write_token (misma prueba de posesión que save-game). Los equipos
// se leen SIEMPRE de saves.game_state en el servidor — el cliente no puede
// inyectar un equipo que no es el suyo.
//
// Timeout (regla de la boda): 1 minuto por respuesta. Si al vencer
// `deadline_at` falta la respuesta de un jugador: en combate gana el otro;
// en intercambio la sesión se cancela. La adjudicación ocurre en `poll`.
// ─────────────────────────────────────────────────────────────────────────
import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 60 s de respuesta + 5 s de gracia por red/animaciones. */
const PHASE_MS = 65_000;
/** Vida de una sala en espera sin que el host dé señales. */
const WAITING_MS = 120_000;

const deadline = (ms: number) => new Date(Date.now() + ms).toISOString();

// ── Saneado del equipo (whitelist de campos, sin PII) ──────────────────────
interface PartyMon {
  id: number;
  level: number;
  xp: number;
  hp: number;
  moves: { id: string; pp: number }[];
  status?: { type: string; turns: number } | null;
  gender?: string | null;
  heldItem?: string | null;
  friendship?: number;
}

// deno-lint-ignore no-explicit-any
const sanitizeParty = (raw: any): PartyMon[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (p) =>
        p &&
        typeof p.id === "number" && p.id >= 1 && p.id <= 251 &&
        typeof p.level === "number" && p.level >= 1 && p.level <= 100,
    )
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      level: Math.floor(p.level),
      xp: typeof p.xp === "number" ? p.xp : 0,
      hp: typeof p.hp === "number" ? Math.max(0, Math.floor(p.hp)) : 1,
      moves: Array.isArray(p.moves)
        ? p.moves
          .filter((m: unknown) =>
            m && typeof (m as { id?: unknown }).id === "string"
          )
          .slice(0, 4)
          .map((m: { id: string; pp?: number }) => ({
            id: m.id,
            pp: typeof m.pp === "number" ? m.pp : 0,
          }))
        : [],
      status: p.status && typeof p.status.type === "string"
        ? { type: p.status.type, turns: p.status.turns ?? 0 }
        : null,
      gender: p.gender === "male" || p.gender === "female" ? p.gender : null,
      heldItem: typeof p.heldItem === "string" ? p.heldItem : null,
      friendship: typeof p.friendship === "number" ? p.friendship : undefined,
    }));
};

// ── Autenticación: prueba de posesión con write_token ─────────────────────
const authenticate = async (userId: string, writeToken: string) => {
  const { data, error } = await db
    .from("saves")
    .select("user_id, write_token, game_state")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !writeToken || data.write_token !== writeToken) return null;
  return data as { user_id: string; game_state: { name?: string; pokemon?: unknown } };
};

// deno-lint-ignore no-explicit-any
const fetchSession = async (sessionId: string): Promise<any> => {
  const { data, error } = await db
    .from("link_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// ── Adjudicación de timeout (se ejecuta en cada poll) ─────────────────────
// deno-lint-ignore no-explicit-any
const adjudicate = async (s: any): Promise<any> => {
  if (!s) return s;
  const expired = new Date(s.deadline_at).getTime() < Date.now();
  if (!expired) return s;

  if (s.status === "waiting") {
    // Sala en espera caducada (host desaparecido): cancelar.
    const { data } = await db
      .from("link_sessions")
      .update({ status: "cancelled", end_reason: "lobby-timeout", updated_at: new Date().toISOString() })
      .eq("id", s.id)
      .eq("status", "waiting")
      .select()
      .maybeSingle();
    return data ?? s;
  }

  if (s.status !== "active") return s;

  // deno-lint-ignore no-explicit-any
  let patch: Record<string, any> | null = null;
  if (s.kind === "trade") {
    // Intercambio: sin respuesta en 1 min → se cancela (nadie pierde nada).
    patch = { status: "cancelled", end_reason: "timeout" };
  } else if (s.phase === "choosing") {
    const hostActed = s.host_action !== null;
    const guestActed = s.guest_action !== null;
    if (!hostActed && !guestActed) {
      patch = { status: "cancelled", end_reason: "timeout-both" };
    } else {
      // El que SÍ respondió a tiempo gana el combate.
      patch = {
        status: "finished",
        phase: "done",
        winner: hostActed ? "host" : "guest",
        end_reason: "timeout",
      };
    }
  } else if (s.phase === "resolving") {
    // El host no publicó la resolución (se desconectó) → gana el guest.
    patch = {
      status: "finished",
      phase: "done",
      winner: "guest",
      end_reason: "timeout",
    };
  }

  if (!patch) return s;
  const { data } = await db
    .from("link_sessions")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", s.id)
    .eq("status", "active")
    .eq("updated_at", s.updated_at) // no pisar una transición concurrente
    .select()
    .maybeSingle();
  return data ?? (await fetchSession(s.id));
};

// ── Intercambio atómico en servidor ────────────────────────────────────────
// Aplica el swap directamente en saves.game_state de los DOS jugadores.
// Comprueba la integridad (la especie ofrecida debe seguir en ese hueco del
// save, que se guardó al entrar al Club Cable) antes de tocar nada.
// Devuelve el end_reason final: "trade-completed" o "trade-integrity".
// deno-lint-ignore no-explicit-any
const applyTradeToSaves = async (s: any): Promise<string> => {
  try {
    const hostOffer = s.host_offer as number;
    const guestOffer = s.guest_offer as number;
    const { data: rows, error } = await db
      .from("saves")
      .select("user_id, game_state")
      .in("user_id", [s.host_id, s.guest_id]);
    if (error) throw error;
    const hostSave = rows?.find((r) => r.user_id === s.host_id);
    const guestSave = rows?.find((r) => r.user_id === s.guest_id);
    // deno-lint-ignore no-explicit-any
    const hostGs = hostSave?.game_state as any;
    // deno-lint-ignore no-explicit-any
    const guestGs = guestSave?.game_state as any;
    const hostMon = hostGs?.pokemon?.[hostOffer];
    const guestMon = guestGs?.pokemon?.[guestOffer];
    // Integridad: el hueco ofrecido debe contener la misma especie que se
    // mostró en la mesa (snapshot de la sesión). Si no, no se toca nada.
    if (
      !hostMon || !guestMon ||
      hostMon.id !== s.host_party?.[hostOffer]?.id ||
      guestMon.id !== s.guest_party?.[guestOffer]?.id
    ) {
      return "trade-integrity";
    }
    // GSC: la amistad del Pokémon recibido vuelve a la base (70).
    const toHost = { ...guestMon, friendship: 70 };
    const toGuest = { ...hostMon, friendship: 70 };
    hostGs.pokemon[hostOffer] = toHost;
    guestGs.pokemon[guestOffer] = toGuest;
    // Pokédex coherente en la nube: el recibido cuenta como visto+capturado.
    for (const [gs, mon] of [[hostGs, toHost], [guestGs, toGuest]] as const) {
      if (Array.isArray(gs.seenPokemon) && !gs.seenPokemon.includes(mon.id)) {
        gs.seenPokemon.push(mon.id);
      }
      if (Array.isArray(gs.caughtPokemon) && !gs.caughtPokemon.includes(mon.id)) {
        gs.caughtPokemon.push(mon.id);
      }
    }
    const ts = new Date().toISOString();
    const { error: e1 } = await db
      .from("saves")
      .update({ game_state: hostGs, updated_at: ts })
      .eq("user_id", s.host_id);
    if (e1) throw e1;
    const { error: e2 } = await db
      .from("saves")
      .update({ game_state: guestGs, updated_at: ts })
      .eq("user_id", s.guest_id);
    if (e2) {
      // Revertir el primer save para no dejar media transacción.
      hostGs.pokemon[hostOffer] = hostMon;
      await db
        .from("saves")
        .update({ game_state: hostGs, updated_at: ts })
        .eq("user_id", s.host_id);
      return "trade-integrity";
    }
    return "trade-completed";
  } catch {
    return "trade-integrity";
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body.action !== "string") {
      return json({ error: "Bad request" }, 400, corsHeaders);
    }
    const { action, userId, writeToken } = body as {
      action: string;
      userId?: string;
      writeToken?: string;
    };
    if (!userId || !UUID_RE.test(userId)) {
      return json({ error: "Invalid userId" }, 400, corsHeaders);
    }
    const me = await authenticate(userId, writeToken ?? "");
    if (!me) return json({ error: "AUTH_FAILED" }, 403, corsHeaders);

    const myName =
      ((me.game_state?.name ?? "") as string).toString().trim() || "Invitado";
    const myParty = sanitizeParty(me.game_state?.pokemon);
    const now = new Date().toISOString();

    // ── create ──────────────────────────────────────────────────────────
    if (action === "create") {
      const kind = body.kind === "trade" ? "trade" : "battle";
      if (myParty.length === 0) {
        return json({ error: "NO_POKEMON" }, 400, corsHeaders);
      }
      if (kind === "battle" && !myParty.some((p) => p.hp > 0)) {
        return json({ error: "ALL_FAINTED" }, 400, corsHeaders);
      }
      // Rate limit: máx. una sala nueva cada 5 s por anfitrión.
      const { data: recent } = await db
        .from("link_sessions")
        .select("created_at")
        .eq("host_id", userId)
        .gt("created_at", new Date(Date.now() - 5_000).toISOString())
        .limit(1);
      if (recent && recent.length > 0) {
        return json({ error: "RATE_LIMIT" }, 429, corsHeaders);
      }
      // Higiene: purgar sesiones terminadas/canceladas de más de un día
      // (los equipos guardados en la fila dejan de ser necesarios).
      await db
        .from("link_sessions")
        .delete()
        .in("status", ["finished", "cancelled"])
        .lt("updated_at", new Date(Date.now() - 86_400_000).toISOString());
      // Una sala en espera por anfitrión: cancelar las anteriores.
      await db
        .from("link_sessions")
        .update({ status: "cancelled", end_reason: "replaced", updated_at: now })
        .eq("host_id", userId)
        .eq("status", "waiting");
      const { data, error } = await db
        .from("link_sessions")
        .insert({
          kind,
          host_id: userId,
          host_name: myName,
          host_party: myParty,
          deadline_at: deadline(WAITING_MS),
        })
        .select()
        .single();
      if (error) throw error;
      return json({ session: data }, 200, corsHeaders);
    }

    // ── list ────────────────────────────────────────────────────────────
    if (action === "list") {
      const kind = body.kind === "trade" ? "trade" : "battle";
      const { data, error } = await db
        .from("link_sessions")
        .select("id, host_id, host_name, created_at, deadline_at")
        .eq("kind", kind)
        .eq("status", "waiting")
        .gt("deadline_at", now)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      const sessions = (data ?? [])
        .filter((s) => s.host_id !== userId)
        .map((s) => ({ sessionId: s.id, hostName: s.host_name }));
      return json({ sessions }, 200, corsHeaders);
    }

    // ── mine: sesión viva del solicitante (reanudar tras recargar la app) ─
    if (action === "mine") {
      const { data, error } = await db
        .from("link_sessions")
        .select("*")
        .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
        .in("status", ["waiting", "active"])
        .gt("deadline_at", now)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      return json({ session: data?.[0] ?? null }, 200, corsHeaders);
    }

    // El resto de acciones operan sobre una sesión concreta.
    const sessionId = body.sessionId as string | undefined;
    if (!sessionId || !UUID_RE.test(sessionId)) {
      return json({ error: "Invalid sessionId" }, 400, corsHeaders);
    }

    // ── join ────────────────────────────────────────────────────────────
    if (action === "join") {
      if (myParty.length === 0) {
        return json({ error: "NO_POKEMON" }, 400, corsHeaders);
      }
      const target = await fetchSession(sessionId);
      if (!target || target.status !== "waiting") {
        return json({ error: "SESSION_GONE" }, 409, corsHeaders);
      }
      if (target.kind === "battle" && !myParty.some((p) => p.hp > 0)) {
        return json({ error: "ALL_FAINTED" }, 400, corsHeaders);
      }
      if (target.host_id === userId) {
        return json({ error: "OWN_SESSION" }, 400, corsHeaders);
      }
      const { data, error } = await db
        .from("link_sessions")
        .update({
          guest_id: userId,
          guest_name: myName,
          guest_party: myParty,
          status: "active",
          phase: target.kind === "battle" ? "choosing" : "offer",
          turn: 1,
          deadline_at: deadline(PHASE_MS),
          guest_seen_at: now,
          updated_at: now,
        })
        .eq("id", sessionId)
        .eq("status", "waiting")
        .is("guest_id", null)
        .select()
        .maybeSingle();
      if (error) throw error;
      // Carrera: otro invitado se unió antes.
      if (!data) return json({ error: "SESSION_GONE" }, 409, corsHeaders);
      return json({ session: data }, 200, corsHeaders);
    }

    // Para poll/act/resolve/cancel hay que ser miembro de la sesión.
    let session = await fetchSession(sessionId);
    if (!session) return json({ error: "SESSION_GONE" }, 409, corsHeaders);
    const role = session.host_id === userId
      ? "host"
      : session.guest_id === userId
      ? "guest"
      : null;
    if (!role) return json({ error: "NOT_MEMBER" }, 403, corsHeaders);

    // ── poll ────────────────────────────────────────────────────────────
    if (action === "poll") {
      const seenPatch = role === "host"
        ? { host_seen_at: now }
        : { guest_seen_at: now };
      // El host en sala de espera mantiene viva la sala con su heartbeat.
      const keepAlive =
        session.status === "waiting" && role === "host"
          ? { deadline_at: deadline(WAITING_MS) }
          : {};
      await db
        .from("link_sessions")
        .update({ ...seenPatch, ...keepAlive })
        .eq("id", sessionId);
      session = await adjudicate(await fetchSession(sessionId));
      return json({ session }, 200, corsHeaders);
    }

    // ── act ─────────────────────────────────────────────────────────────
    if (action === "act") {
      if (session.status !== "active") {
        return json({ session }, 200, corsHeaders); // ya terminó: devolver estado
      }
      const payload = body.payload as
        | { type: string; [k: string]: unknown }
        | undefined;
      if (!payload || typeof payload.type !== "string") {
        return json({ error: "Bad payload" }, 400, corsHeaders);
      }

      if (session.kind === "battle") {
        if (payload.type === "forfeit") {
          // GSC: huir de un combate de enlace = rendirse.
          const { data } = await db
            .from("link_sessions")
            .update({
              status: "finished",
              phase: "done",
              winner: role === "host" ? "guest" : "host",
              end_reason: "forfeit",
              updated_at: now,
            })
            .eq("id", sessionId)
            .eq("status", "active")
            .select()
            .maybeSingle();
          return json({ session: data ?? session }, 200, corsHeaders);
        }
        if (session.phase !== "choosing") {
          return json({ error: "WRONG_PHASE" }, 409, corsHeaders);
        }
        const actionCol = role === "host" ? "host_action" : "guest_action";
        await db
          .from("link_sessions")
          .update({ [actionCol]: payload, updated_at: now })
          .eq("id", sessionId)
          .eq("status", "active")
          .eq("phase", "choosing");
        // Transición atómica e idempotente: ambos han actuado → resolving.
        await db
          .from("link_sessions")
          .update({
            phase: "resolving",
            deadline_at: deadline(PHASE_MS),
            updated_at: now,
          })
          .eq("id", sessionId)
          .eq("status", "active")
          .eq("phase", "choosing")
          .not("host_action", "is", null)
          .not("guest_action", "is", null);
        session = await fetchSession(sessionId);
        return json({ session }, 200, corsHeaders);
      }

      // ── trade ──
      if (payload.type === "offer") {
        if (session.phase !== "offer") {
          return json({ error: "WRONG_PHASE" }, 409, corsHeaders);
        }
        const index = Number(payload.index);
        const party = role === "host" ? session.host_party : session.guest_party;
        if (!Number.isInteger(index) || index < 0 || index >= (party?.length ?? 0)) {
          return json({ error: "Bad index" }, 400, corsHeaders);
        }
        const offerCol = role === "host" ? "host_offer" : "guest_offer";
        await db
          .from("link_sessions")
          .update({ [offerCol]: index, updated_at: now })
          .eq("id", sessionId)
          .eq("status", "active")
          .eq("phase", "offer");
        // Ambas ofertas sobre la mesa → fase de confirmación (1 min).
        await db
          .from("link_sessions")
          .update({
            phase: "confirm",
            host_confirm: false,
            guest_confirm: false,
            deadline_at: deadline(PHASE_MS),
            updated_at: now,
          })
          .eq("id", sessionId)
          .eq("status", "active")
          .eq("phase", "offer")
          .not("host_offer", "is", null)
          .not("guest_offer", "is", null);
        session = await fetchSession(sessionId);
        return json({ session }, 200, corsHeaders);
      }

      if (payload.type === "confirm") {
        if (session.phase !== "confirm") {
          return json({ error: "WRONG_PHASE" }, 409, corsHeaders);
        }
        const confirmCol = role === "host" ? "host_confirm" : "guest_confirm";
        await db
          .from("link_sessions")
          .update({ [confirmCol]: true, updated_at: now })
          .eq("id", sessionId)
          .eq("status", "active")
          .eq("phase", "confirm");
        // Ambos confirmaron → cerrar el intercambio. La transición es
        // exclusiva (el lock de fila de Postgres garantiza que solo UNA de
        // las dos peticiones concurrentes pasa de active→finishing): esa
        // petición aplica el swap EN LOS SAVES de los dos jugadores, de
        // forma que el intercambio queda persistido aunque un cliente se
        // caiga justo después (sin medias transacciones ni duplicados).
        const { data: won } = await db
          .from("link_sessions")
          .update({
            status: "finished",
            phase: "done",
            end_reason: "trade-finishing",
            updated_at: now,
          })
          .eq("id", sessionId)
          .eq("status", "active")
          .eq("phase", "confirm")
          .eq("host_confirm", true)
          .eq("guest_confirm", true)
          .select()
          .maybeSingle();
        if (won) {
          const outcome = await applyTradeToSaves(won);
          await db
            .from("link_sessions")
            .update({ end_reason: outcome, updated_at: new Date().toISOString() })
            .eq("id", sessionId);
        }
        session = await fetchSession(sessionId);
        return json({ session }, 200, corsHeaders);
      }

      if (payload.type === "reject") {
        // GSC: rechazar la confirmación vuelve a la mesa de selección.
        await db
          .from("link_sessions")
          .update({
            phase: "offer",
            host_offer: null,
            guest_offer: null,
            host_confirm: false,
            guest_confirm: false,
            deadline_at: deadline(PHASE_MS),
            updated_at: now,
          })
          .eq("id", sessionId)
          .eq("status", "active")
          .eq("phase", "confirm");
        session = await fetchSession(sessionId);
        return json({ session }, 200, corsHeaders);
      }

      return json({ error: "Bad payload" }, 400, corsHeaders);
    }

    // ── resolve (solo host, combate) ────────────────────────────────────
    if (action === "resolve") {
      if (role !== "host" || session.kind !== "battle") {
        return json({ error: "NOT_HOST" }, 403, corsHeaders);
      }
      if (session.status !== "active" || session.phase !== "resolving") {
        return json({ session }, 200, corsHeaders);
      }
      const resolution = body.resolution as {
        turn?: number;
        winner?: "host" | "guest" | "draw" | null;
        hostParty?: unknown;
        guestParty?: unknown;
      } | undefined;
      if (!resolution || resolution.turn !== session.turn) {
        return json({ error: "Bad resolution" }, 400, corsHeaders);
      }
      const finished = !!resolution.winner;
      const newHostParty = sanitizeParty(resolution.hostParty);
      const newGuestParty = sanitizeParty(resolution.guestParty);
      // Anti-trampa básica: declarar un ganador exige que el equipo perdedor
      // esté TODO debilitado en el snapshot publicado. No impide a un host
      // malicioso falsear HPs, pero bloquea el atajo de "declararse ganador".
      if (finished) {
        const hostOut = newHostParty.length > 0 && newHostParty.every((p) => p.hp <= 0);
        const guestOut = newGuestParty.length > 0 && newGuestParty.every((p) => p.hp <= 0);
        const valid =
          (resolution.winner === "host" && guestOut) ||
          (resolution.winner === "guest" && hostOut) ||
          (resolution.winner === "draw" && hostOut && guestOut);
        if (!valid) {
          return json({ error: "Bad resolution" }, 400, corsHeaders);
        }
      }
      const { data, error } = await db
        .from("link_sessions")
        .update({
          resolution,
          host_party: newHostParty.length ? newHostParty : session.host_party,
          guest_party: newGuestParty.length ? newGuestParty : session.guest_party,
          host_action: null,
          guest_action: null,
          turn: session.turn + 1,
          phase: finished ? "done" : "choosing",
          status: finished ? "finished" : "active",
          winner: finished ? resolution.winner : null,
          end_reason: finished ? "battle-ended" : null,
          deadline_at: deadline(PHASE_MS),
          updated_at: now,
        })
        .eq("id", sessionId)
        .eq("status", "active")
        .eq("phase", "resolving")
        .select()
        .maybeSingle();
      if (error) throw error;
      return json({ session: data ?? session }, 200, corsHeaders);
    }

    // ── cancel ──────────────────────────────────────────────────────────
    if (action === "cancel") {
      if (session.status === "waiting") {
        const { data } = await db
          .from("link_sessions")
          .update({ status: "cancelled", end_reason: "host-left", updated_at: now })
          .eq("id", sessionId)
          .eq("status", "waiting")
          .select()
          .maybeSingle();
        return json({ session: data ?? session }, 200, corsHeaders);
      }
      if (session.status === "active") {
        const patch = session.kind === "battle"
          ? {
            // Abandonar un combate activo = rendirse (gana el otro).
            status: "finished",
            phase: "done",
            winner: role === "host" ? "guest" : "host",
            end_reason: "forfeit",
          }
          : { status: "cancelled", end_reason: `${role}-left` };
        const { data } = await db
          .from("link_sessions")
          .update({ ...patch, updated_at: now })
          .eq("id", sessionId)
          .eq("status", "active")
          .select()
          .maybeSingle();
        return json({ session: data ?? session }, 200, corsHeaders);
      }
      return json({ session }, 200, corsHeaders);
    }

    return json({ error: "Unknown action" }, 400, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
