import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

// Modo mantenimiento global del juego.
//  · GET  (público)          → { maintenance: boolean, message: string }
//  · POST (con x-admin-secret) → activa/desactiva y (opcional) fija el mensaje.
// El estado vive en la tabla `app_config` (fila id=1). El juego lo consulta al
// arrancar; el panel de admin lo alterna. Cambia al instante (sin recompilar).
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (req.method === "GET") {
      const { data } = await db
        .from("app_config")
        .select("maintenance, message")
        .eq("id", 1)
        .maybeSingle();
      return json(
        { maintenance: !!data?.maintenance, message: data?.message ?? "" },
        200,
        corsHeaders,
      );
    }

    if (req.method === "POST") {
      const adminSecret = req.headers.get("x-admin-secret");
      if (!adminSecret || adminSecret !== Deno.env.get("ADMIN_SECRET")) {
        return json({ error: "Unauthorized" }, 401, corsHeaders);
      }
      const body = await req.json().catch(() => ({}));
      const patch: Record<string, unknown> = {
        id: 1,
        maintenance: !!body.maintenance,
        updated_at: new Date().toISOString(),
      };
      if (typeof body.message === "string") patch.message = body.message;
      const { error } = await db.from("app_config").upsert(patch, { onConflict: "id" });
      if (error) throw error;
      return json({ ok: true, maintenance: !!body.maintenance }, 200, corsHeaders);
    }

    return json({ error: "Method not allowed" }, 405, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
