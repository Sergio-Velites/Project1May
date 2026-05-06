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
    attended: boolean;
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

    // Ensure the user exists in wedding_users.
    // "Jugar sin guardar" players have a locally-generated UUID not yet in the DB.
    // INSERT ... ON CONFLICT DO NOTHING is the safest atomic approach.
    const { error: userErr } = await db.from("wedding_users").insert({ id: userId });
    // 23505 = unique_violation → user already exists, that's fine
    if (userErr && userErr.code !== "23505") throw userErr;

    const { error } = await db.rpc("upsert_rsvp", {
      p_user_id:      userId,
      p_player_name:  rsvp.playerName,
      p_companion:    rsvp.companion ?? null,
      p_children:     rsvp.children ?? 0,
      p_allergies:    rsvp.allergies ?? null,
      p_bus_outbound: rsvp.busOutbound ?? false,
      p_bus_return:   rsvp.busReturn ?? "none",
      p_preboda:      rsvp.preboda ?? false,
      p_attended:     rsvp.attended ?? true,
    });

    if (error) throw error;

    return json({ ok: true }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
