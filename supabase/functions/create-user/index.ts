// Fallback para navegadores sin WebAuthn: crea un usuario anónimo con UUID aleatorio
import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { data: user, error } = await db
      .from("wedding_users")
      .insert({})
      .select("id")
      .single();
    if (error) throw error;

    return json({ userId: user.id }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
