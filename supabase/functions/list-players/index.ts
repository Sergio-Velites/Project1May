import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const excludeUserId = url.searchParams.get("excludeUserId");


    const { data, error } = await db
      .from("saves")
      .select("user_id, game_state, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const players = (data ?? [])
      .map((row: { user_id: string; game_state: unknown }) => {
        const gs = row.game_state as { name?: string; pokemon?: unknown[] } | null;
        const rawName = (gs?.name ?? "").toString().trim();
        const pokemonCount = Array.isArray(gs?.pokemon) ? gs!.pokemon!.length : 0;
        return {
          playerId: row.user_id,
          name: rawName || "Invitado",
          pokemonCount,
        };
      })
      // Filtros: excluir al jugador actual y a los que no tienen equipo Pokémon.
      .filter((p) => p.pokemonCount > 0 && p.playerId !== excludeUserId);

    return json({ players }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
