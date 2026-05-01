import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { userId, gameState } = await req.json();
    if (!userId || !gameState) throw new Error("userId and gameState are required");

    const { error } = await db.rpc("upsert_save", {
      p_user_id: userId,
      p_game_state: gameState,
    });
    if (error) throw error;

    return json({ success: true }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
