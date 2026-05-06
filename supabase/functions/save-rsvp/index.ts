import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

interface RSVPPayload {
  userId: string;
  rsvp: {
    playerName: string;
    companion: string | null;
    children: number;
    allergies: string | null;
    busOutbound: boolean;
    busReturn: "none" | "23:00" | "1:45";
    preboda: boolean;
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json() as RSVPPayload;
    const { userId, rsvp } = body;

    if (!userId || !rsvp || !rsvp.playerName) {
      return json({ error: "Faltan campos obligatorios" }, 400, corsHeaders);
    }

    // Ensure user exists in wedding_users.
    // Users who played "sin guardar" have a local UUID not in the DB.
    await db.from("wedding_users").upsert({ id: userId }, { ignoreDuplicates: true });

    const { error } = await db.rpc("upsert_rsvp", {
      p_user_id:      userId,
      p_player_name:  rsvp.playerName,
      p_companion:    rsvp.companion ?? null,
      p_children:     rsvp.children ?? 0,
      p_allergies:    rsvp.allergies ?? null,
      p_bus_outbound: rsvp.busOutbound ?? false,
      p_bus_return:   rsvp.busReturn ?? "none",
      p_preboda:      rsvp.preboda ?? false,
    });

    if (error) throw error;

    return json({ ok: true }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
