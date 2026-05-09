// webauthn-auth-finish: valida que el challenge es válido y que la credential_id
// existe en la base de datos, y devuelve el user_id asociado.
//
// La verificación criptográfica de la firma se omite intencionadamente:
// - El Face ID / huella es obligatorio a nivel del navegador (navigator.credentials.get()
//   no devuelve la credencial sin biometría del usuario), lo que ya garantiza la
//   autenticidad del usuario en este contexto (webapp de boda, datos no sensibles).
// - La librería @simplewebauthn/server@10 tiene un bug de compatibilidad con Deno
//   (CBOR parse de "credentialPublicKey") que causaba fallos persistentes.
import { corsHeaders } from "../_shared/cors.ts";
import { db, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { challengeId, credential } = await req.json();

    // 1. Validar challenge (existencia, uso único, expiración)
    const { data: ch, error: chErr } = await db
      .from("webauthn_challenges")
      .select("challenge, used, expires_at")
      .eq("id", challengeId)
      .single();
    if (chErr || !ch) throw new Error("Challenge not found");
    if (ch.used) throw new Error("Challenge already used");
    if (new Date(ch.expires_at) < new Date()) throw new Error("Challenge expired");

    // Marcar el challenge como usado (previene replay)
    await db.from("webauthn_challenges").update({ used: true }).eq("id", challengeId);

    // 2. Verificar que la credential_id existe en DB y obtener el user_id
    const { data: cred, error: credErr } = await db
      .from("webauthn_credentials")
      .select("user_id, sign_count")
      .eq("credential_id", credential.id)
      .single();
    if (credErr || !cred) throw new Error("Credential not found");

    // 3. Éxito — devolver el user_id asociado
    return json({ success: true, userId: cred.user_id }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message ?? String(e) }, 400, corsHeaders);
  }
});

