import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Simple admin auth via header
  const key = req.headers.get("x-admin-key") ?? "";
  if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
    return json({ error: "No autorizado" }, 401, corsHeaders);
  }

  try {
    // Fetch all RSVPs
    const { data: rsvps, error: rsvpError } = await db
      .from("rsvp")
      .select("*")
      .order("created_at", { ascending: true });

    if (rsvpError) throw rsvpError;

    // Fetch all saves (for pokemon data)
    const { data: saves, error: savesError } = await db
      .from("saves")
      .select("user_id, game_state");

    if (savesError) throw savesError;

    // Build index of saves by user_id
    type GameStateRsvp = {
      playerName?: string;
      companion?: string | null;
      children?: number;
      allergies?: string | null;
      busOutbound?: string;
      busReturn?: string;
      preboda?: boolean;
      attended?: boolean;
    };
    type GameState = {
      name?: string;
      pokemon?: unknown[];
      rsvp?: GameStateRsvp;
      map?: string;
      pos?: { x: number; y: number };
    } | null;
    type SaveRow = { user_id: string; game_state: GameState };
    const savesMap = Object.fromEntries(
      (saves as SaveRow[]).map((s) => [s.user_id, s.game_state])
    );

    // ── Entradas con RSVP (enriquecidas con pokémon) ───────────────────────
    type RsvpRow = {
      user_id: string;
      player_name: string;
      companion: string | null;
      children: number;
      allergies: string | null;
      bus_outbound: string;
      bus_return: string;
      preboda: boolean;
      attended: boolean;
      created_at: string;
      updated_at: string;
    };

    const rsvpUserIds = new Set((rsvps as RsvpRow[]).map((r) => r.user_id));

    const rsvpEntries = (rsvps as RsvpRow[]).map((r) => {
      const gs = savesMap[r.user_id];
      return {
        ...r,
        hasRsvp: true,
        source: "rsvp_table" as const,
        pokemon: gs?.pokemon ?? [],
        map: gs?.map ?? null,
        pos: gs?.pos ?? null,
      };
    });

    // ── Jugadores sin fila en rsvp pero con partida guardada ────────────────
    // Si game_state.rsvp existe, usar esos datos como fuente fiable
    // (saveToCloud + saveRsvp se llaman en paralelo — uno puede fallar y otro no).
    // Además, hacemos BACKFILL: si tenemos los datos en game_state, aprovechamos
    // la lectura para upsertear la fila en la tabla rsvp y autorrepararnos.
    const backfillPromises: Promise<unknown>[] = [];
    const savesOnlyEntries = (saves as SaveRow[])
      .filter((s) => !rsvpUserIds.has(s.user_id))
      .map((s) => {
        const gsRsvp = s.game_state?.rsvp;
        if (gsRsvp && gsRsvp.playerName) {
          // Backfill: asegurar wedding_user + upsert rsvp para próximas lecturas
          backfillPromises.push((async () => {
            console.log("[backfill] start", s.user_id, gsRsvp.playerName);
            const { error: userErr } = await db.from("wedding_users").insert({ id: s.user_id });
            if (userErr && userErr.code !== "23505") {
              console.error("[backfill] wedding_users insert error:", userErr);
              return;
            }
            const { error: rpcErr } = await db.rpc("upsert_rsvp", {
              p_user_id:      s.user_id,
              p_player_name:  gsRsvp.playerName,
              p_companion:    gsRsvp.companion ?? null,
              p_children:     gsRsvp.children ?? 0,
              p_allergies:    gsRsvp.allergies ?? null,
              p_bus_outbound: gsRsvp.busOutbound ?? "none",
              p_bus_return:   gsRsvp.busReturn ?? "none",
              p_preboda:      gsRsvp.preboda ?? false,
              p_attended:     gsRsvp.attended ?? true,
            });
            if (rpcErr) console.error("[backfill] upsert_rsvp error:", rpcErr);
            else console.log("[backfill] OK", s.user_id);
          })());
          return {
            user_id: s.user_id,
            player_name: gsRsvp.playerName ?? s.game_state?.name ?? "Desconocido",
            companion: gsRsvp.companion ?? null,
            children: gsRsvp.children ?? 0,
            allergies: gsRsvp.allergies ?? null,
            bus_outbound: gsRsvp.busOutbound ?? "none",
            bus_return: gsRsvp.busReturn ?? "none",
            preboda: gsRsvp.preboda ?? false,
            attended: gsRsvp.attended ?? null,
            hasRsvp: true,
            source: "game_state" as const,
            pokemon: s.game_state?.pokemon ?? [],
            map: s.game_state?.map ?? null,
            pos: s.game_state?.pos ?? null,
          };
        }
        return {
          user_id: s.user_id,
          player_name: s.game_state?.name ?? "Desconocido",
          companion: null,
          children: 0,
          allergies: null,
          bus_outbound: "none",
          bus_return: "none",
          preboda: false,
          attended: null,
          hasRsvp: false,
          source: "none" as const,
          pokemon: s.game_state?.pokemon ?? [],
          map: s.game_state?.map ?? null,
          pos: s.game_state?.pos ?? null,
        };
      });

    // Ejecutar backfills en paralelo (best-effort, no bloquea la respuesta).
    await Promise.allSettled(backfillPromises);

    const entries = [...rsvpEntries, ...savesOnlyEntries];

    return json({ entries }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
