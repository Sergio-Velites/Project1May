import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

// Modo mantenimiento global del juego, con lista de jugadores exentos.
//
//  · GET (público) → { maintenance, message, bypass }
//      El juego puede identificarse con ?player=<uuid> + cabecera x-write-token.
//      `bypass` solo es true si el jugador está en `allowed_players` Y presenta
//      el write_token correcto de su partida (prueba de posesión: conocer el
//      UUID de otro invitado no sirve). La lista NUNCA se expone en esta rama.
//  · GET (con x-admin-secret) → añade { allowedPlayers: uuid[] } a la respuesta.
//  · POST (con x-admin-secret) → fija { maintenance, message?, allowedPlayers? }.
//
// El estado vive en `app_config` (fila única id=1). El juego lo consulta al
// arrancar; el map-editor lo administra. Cambia al instante (sin recompilar).

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const secret = req.headers.get("x-admin-secret");
    const isAdmin = !!secret && secret === Deno.env.get("ADMIN_SECRET");

    if (req.method === "GET") {
      const { data } = await db
        .from("app_config")
        .select("maintenance, message, allowed_players")
        .eq("id", 1)
        .maybeSingle();

      const maintenance = !!data?.maintenance;
      const message = data?.message ?? "";
      const allowed: string[] = Array.isArray(data?.allowed_players)
        ? (data!.allowed_players as string[])
        : [];

      // Bypass: solo se calcula si hay mantenimiento y el juego se identifica.
      let bypass = false;
      const url = new URL(req.url);
      const player = url.searchParams.get("player");
      const writeToken = req.headers.get("x-write-token");
      if (
        maintenance &&
        player && UUID_RE.test(player) &&
        writeToken &&
        allowed.some((id) => id.toLowerCase() === player.toLowerCase())
      ) {
        const { data: save } = await db
          .from("saves")
          .select("write_token")
          .eq("user_id", player)
          .maybeSingle();
        bypass = !!save?.write_token && save.write_token === writeToken;
      }

      const body: Record<string, unknown> = { maintenance, message, bypass };
      if (isAdmin) body.allowedPlayers = allowed;
      return json(body, 200, corsHeaders);
    }

    if (req.method === "POST") {
      if (!isAdmin) return json({ error: "Unauthorized" }, 401, corsHeaders);

      const body = await req.json().catch(() => ({}));
      const patch: Record<string, unknown> = {
        id: 1,
        updated_at: new Date().toISOString(),
      };
      if (typeof body.maintenance === "boolean") patch.maintenance = body.maintenance;
      if (typeof body.message === "string") patch.message = body.message;
      if (Array.isArray(body.allowedPlayers)) {
        // Se valida formato UUID y se deduplica; una entrada inválida se descarta.
        const clean = [...new Set(
          (body.allowedPlayers as unknown[])
            .filter((v): v is string => typeof v === "string" && UUID_RE.test(v))
            .map((v) => v.toLowerCase()),
        )];
        patch.allowed_players = clean;
      }
      const { error } = await db.from("app_config").upsert(patch, { onConflict: "id" });
      if (error) throw error;

      const { data } = await db
        .from("app_config")
        .select("maintenance, message, allowed_players")
        .eq("id", 1)
        .maybeSingle();
      return json({
        ok: true,
        maintenance: !!data?.maintenance,
        message: data?.message ?? "",
        allowedPlayers: data?.allowed_players ?? [],
      }, 200, corsHeaders);
    }

    return json({ error: "Method not allowed" }, 405, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
