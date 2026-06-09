// admin-player: CRUD de partida de un jugador para el panel de administración.
// GET  ?userId=xxx     → devuelve game_state completo
// PUT  body{userId, gameState} → actualiza game_state
// DELETE body{userId}  → elimina el jugador (cascade)
// Auth: x-admin-key header con ADMIN_SECRET
import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = req.headers.get("x-admin-key") ?? "";
  if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
    return json({ error: "No autorizado" }, 401, corsHeaders);
  }

  try {
    const url = new URL(req.url);

    // ── GET: obtener game_state ────────────────────────────────────────────
    if (req.method === "GET") {
      const userId = url.searchParams.get("userId");
      if (!userId) return json({ error: "userId requerido" }, 400, corsHeaders);
      if (!UUID_RE.test(userId)) return json({ error: "userId inválido" }, 400, corsHeaders);

      const { data, error } = await db
        .from("saves")
        .select("game_state")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return json({ error: "Jugador no encontrado" }, 404, corsHeaders);

      return json({ gameState: data.game_state }, 200, corsHeaders);
    }

    // ── PUT: actualizar game_state ─────────────────────────────────────────
    if (req.method === "PUT") {
      const body = await req.json();
      const userId    = body.userId    ?? url.searchParams.get("userId");
      const gameState = body.gameState;

      if (!userId)    return json({ error: "userId requerido" }, 400, corsHeaders);
      if (!UUID_RE.test(userId)) return json({ error: "userId inválido" }, 400, corsHeaders);
      if (!gameState || typeof gameState !== "object" || Array.isArray(gameState))
        return json({ error: "gameState requerido y debe ser un objeto" }, 400, corsHeaders);

      // Mismas validaciones que save-game
      const gs = gameState as Record<string, unknown>;
      if (Array.isArray(gs.pokemon)) {
        if (gs.pokemon.length > 6)
          return json({ error: "Máximo 6 Pokémon en el equipo" }, 400, corsHeaders);
        for (const p of gs.pokemon as { level?: number; id?: number }[]) {
          if (typeof p.level === "number" && (p.level < 1 || p.level > 100))
            return json({ error: "Nivel de Pokémon fuera de rango (1-100)" }, 400, corsHeaders);
          if (typeof p.id === "number" && (p.id < 1 || p.id > 251))
            return json({ error: "ID de Pokémon inválido (1-251)" }, 400, corsHeaders);
        }
      }
      if (typeof gs.money === "number" && (gs.money < 0 || gs.money > 999999))
        return json({ error: "Dinero fuera de rango (0-999999)" }, 400, corsHeaders);

      const { error } = await db
        .from("saves")
        .update({ game_state: gameState, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (error) throw error;
      return json({ updated: true }, 200, corsHeaders);
    }

    // ── DELETE: eliminar jugador ──────────────────────────────────────────
    if (req.method === "DELETE") {
      const body = await req.json();
      const userId = body.userId ?? url.searchParams.get("userId");
      if (!userId) return json({ error: "userId requerido" }, 400, corsHeaders);
      if (!UUID_RE.test(userId)) return json({ error: "userId inválido" }, 400, corsHeaders);

      const { error } = await db
        .from("wedding_users")
        .delete()
        .eq("id", userId);

      if (error) throw error;
      return json({ deleted: true }, 200, corsHeaders);
    }

    return json({ error: "Método no soportado" }, 405, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
