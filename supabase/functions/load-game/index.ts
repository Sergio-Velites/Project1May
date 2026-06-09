import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{64}$/;

// Campos del game_state que contienen datos personales del invitado y NO deben
// devolverse en lecturas que no prueben posesión de la cuenta (p.ej. la lista de
// rivales para batallas online, que cualquiera puede consultar). El `name` de
// nivel superior es el nombre de entrenador elegido en el juego (público a
// propósito en el selector de batalla), pero `rsvp` lleva nombre real,
// acompañante, alergias, asistencia, etc.
const PII_FIELDS = ["rsvp"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) throw new Error("userId is required");
    if (!UUID_RE.test(userId)) throw new Error("Invalid userId format");

    const { data, error } = await db
      .from("saves")
      .select("game_state, write_token")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;

    let gameState = data?.game_state ?? null;

    // Redacción de PII: solo el propietario (que presenta el write_token correcto
    // por cabecera) recibe el game_state íntegro. Cualquier otra lectura —
    // batallas online o accesos directos a la función — recibe la versión sin
    // datos personales. Sin esto, list-players (que expone todos los user_id)
    // + load-game permitían volcar el RSVP de todos los invitados.
    if (gameState && typeof gameState === "object" && !Array.isArray(gameState)) {
      const providedToken = req.headers.get("x-write-token");
      const isOwner =
        !!providedToken &&
        TOKEN_RE.test(providedToken) &&
        !!data?.write_token &&
        providedToken === data.write_token;

      if (!isOwner) {
        const redacted: Record<string, unknown> = { ...(gameState as Record<string, unknown>) };
        for (const f of PII_FIELDS) delete redacted[f];
        gameState = redacted;
      }
    }

    return json({ gameState }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
