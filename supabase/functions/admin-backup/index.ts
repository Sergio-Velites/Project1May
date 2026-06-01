// admin-backup: exporta e importa todas las partidas y RSVPs.
// GET  → devuelve JSON con { version, exportedAt, saves, rsvp }
// POST body{version, saves, rsvp} → restaura con upsert (no borra registros)
// Auth: x-admin-key header con ADMIN_SECRET
import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const ADMIN_SECRET = Deno.env.get("ADMIN_SECRET") ?? "";

function randomHex32(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const key = req.headers.get("x-admin-key") ?? "";
  if (!ADMIN_SECRET || key !== ADMIN_SECRET) {
    return json({ error: "No autorizado" }, 401, corsHeaders);
  }

  try {
    // ── GET: exportar backup ───────────────────────────────────────────────
    if (req.method === "GET") {
      const [savesRes, rsvpRes] = await Promise.all([
        db.from("saves")
          .select("user_id, game_state, write_token, updated_at")
          .order("updated_at", { ascending: false }),
        db.from("rsvp")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (savesRes.error) throw savesRes.error;
      if (rsvpRes.error)  throw rsvpRes.error;

      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        saves: (savesRes.data ?? []).map((row: {
          user_id: string; game_state: unknown; write_token: string; updated_at: string;
        }) => ({
          userId:     row.user_id,
          gameState:  row.game_state,
          writeToken: row.write_token,
          updatedAt:  row.updated_at,
        })),
        rsvp: (rsvpRes.data ?? []).map((row: Record<string, unknown>) => ({
          userId:      row.user_id,
          playerName:  row.player_name,
          companion:   row.companion,
          children:    row.children,
          allergies:   row.allergies,
          busOutbound: row.bus_outbound,
          busReturn:   row.bus_return,
          preboda:     row.preboda,
          attended:    row.attended,
          createdAt:   row.created_at,
          updatedAt:   row.updated_at,
        })),
      };

      return json(backup, 200, corsHeaders);
    }

    // ── POST: restaurar backup ────────────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();

      if (!body || body.version !== 1 || !Array.isArray(body.saves)) {
        return json({ error: "Formato de backup inválido (se espera { version: 1, saves: [...] })" }, 400, corsHeaders);
      }

      const TOKEN_RE = /^[0-9a-f]{64}$/;
      let restoredSaves = 0;
      let restoredRsvp  = 0;
      const errors: string[] = [];

      for (const save of body.saves) {
        if (!save?.userId || typeof save.userId !== "string") continue;
        if (!save.gameState || typeof save.gameState !== "object")  continue;

        await db.from("wedding_users")
          .upsert({ id: save.userId }, { onConflict: "id", ignoreDuplicates: true });

        const writeToken = typeof save.writeToken === "string" && TOKEN_RE.test(save.writeToken)
          ? save.writeToken
          : randomHex32();

        const { error } = await db.from("saves").upsert({
          user_id:    save.userId,
          game_state: save.gameState,
          write_token: writeToken,
          updated_at: save.updatedAt ?? new Date().toISOString(),
        }, { onConflict: "user_id" });

        if (error) errors.push(`save ${save.userId}: ${error.message}`);
        else restoredSaves++;
      }

      if (Array.isArray(body.rsvp)) {
        for (const rsvp of body.rsvp) {
          if (!rsvp?.userId || typeof rsvp.userId !== "string") continue;
          if (!rsvp.playerName) continue;

          await db.from("wedding_users")
            .upsert({ id: rsvp.userId }, { onConflict: "id", ignoreDuplicates: true });

          const { error } = await db.from("rsvp").upsert({
            user_id:     rsvp.userId,
            player_name: rsvp.playerName,
            companion:   rsvp.companion   ?? null,
            children:    rsvp.children    ?? 0,
            allergies:   rsvp.allergies   ?? null,
            bus_outbound: rsvp.busOutbound ?? "none",
            bus_return:  rsvp.busReturn   ?? "none",
            preboda:     rsvp.preboda     ?? false,
            attended:    rsvp.attended    ?? true,
            updated_at:  rsvp.updatedAt   ?? new Date().toISOString(),
          }, { onConflict: "user_id" });

          if (error) errors.push(`rsvp ${rsvp.userId}: ${error.message}`);
          else restoredRsvp++;
        }
      }

      return json({
        restored: { saves: restoredSaves, rsvp: restoredRsvp },
        errors: errors.length ? errors : undefined,
      }, 200, corsHeaders);
    }

    return json({ error: "Método no soportado" }, 405, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
