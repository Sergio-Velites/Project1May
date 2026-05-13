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
    type SaveRow = { user_id: string; game_state: { pokemon?: unknown[] } | null };
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
      bus_outbound: boolean;
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
      pokemon: savesMap[r.user_id]?.pokemon ?? [],
    }));

    // ── Jugadores sin RSVP (solo tienen partida guardada) ───────────────────
    type SaveRowFull = { user_id: string; game_state: { name?: string; pokemon?: unknown[] } | null };
    const savesOnlyEntries = (saves as SaveRowFull[])
      .filter((s) => !rsvpUserIds.has(s.user_id))
      .map((s) => ({
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
        pokemon: s.game_state?.pokemon ?? [],
      }));

    const entries = [...rsvpEntries, ...savesOnlyEntries];

    return json({ entries }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
