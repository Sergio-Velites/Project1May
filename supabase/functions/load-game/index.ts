import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) throw new Error("userId is required");

    const { data, error } = await db
      .from("saves")
      .select("game_state")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;

    return json({ gameState: data?.game_state ?? null }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
