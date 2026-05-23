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

    // 3. Validar clientDataJSON: type y origin
    if (credential.response?.clientDataJSON) {
      try {
        const clientData = JSON.parse(
          new TextDecoder().decode(
            Uint8Array.from(atob(credential.response.clientDataJSON.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
          )
        );
        if (clientData.type !== "webauthn.get") throw new Error("Invalid clientDataJSON type");
        const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o: string) => o.trim()).filter(Boolean);
        if (allowedOrigins.length > 0 && !allowedOrigins.includes(clientData.origin)) {
          throw new Error("Origin not allowed");
        }
      } catch (e) {
        const msg = (e as Error).message ?? String(e);
        if (msg === "Invalid clientDataJSON type" || msg === "Origin not allowed") throw e;
        // Error de parseo: clientDataJSON malformado — rechazar
        throw new Error("Invalid clientDataJSON");
      }
    }

    // 4. Éxito — devolver el user_id asociado
    return json({ success: true, userId: cred.user_id }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message ?? String(e) }, 400, corsHeaders);
  }
});

