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
    type GameState = { name?: string; pokemon?: unknown[]; rsvp?: GameStateRsvp } | null;
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

    const rsvpEntries = (rsvps as RsvpRow[]).map((r) => ({
      ...r,
      hasRsvp: true,
      source: "rsvp_table" as const,
      pokemon: savesMap[r.user_id]?.pokemon ?? [],
    }));

    // ── Jugadores sin fila en rsvp pero con partida guardada ────────────────
    // Si game_state.rsvp existe, usar esos datos como fuente fiable
    // (saveToCloud + saveRsvp se llaman en paralelo — uno puede fallar y otro no).
    const savesOnlyEntries = (saves as SaveRow[])
      .filter((s) => !rsvpUserIds.has(s.user_id))
      .map((s) => {
        const gsRsvp = s.game_state?.rsvp;
        if (gsRsvp) {
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
        };
      });

    const entries = [...rsvpEntries, ...savesOnlyEntries];

    return json({ entries }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
