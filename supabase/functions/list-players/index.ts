import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { data, error } = await db
      .from("saves")
      .select("user_id, game_state")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const players = (data ?? []).map((row: { user_id: string; game_state: unknown }) => {
      const gs = row.game_state as { name?: string; pokemon?: unknown[] } | null;
      return {
        playerId: row.user_id,
        name: gs?.name ?? "Invitado",
        pokemonCount: gs?.pokemon?.length ?? 0,
      };
    });

    return json({ players }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
