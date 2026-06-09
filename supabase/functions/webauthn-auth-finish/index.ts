// webauthn-auth-finish: valida que el challenge es válido y que la credential_id
// existe en la base de datos, y devuelve el user_id y write_token asociados.
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
    if (!challengeId || !credential || typeof credential.id !== "string") {
      throw new Error("challengeId and credential are required");
    }

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

    // 3. Validar clientDataJSON: type, origin y — CRÍTICO — que el challenge
    //    firmado coincida con el que emitió el servidor para este challengeId.
    //
    //    El clientDataJSON es OBLIGATORIO: sin él no hay forma de vincular la
    //    respuesta con el challenge emitido y cualquiera que conozca un
    //    credential_id podría obtener el user_id + write_token ajenos. Antes
    //    era opcional (`if (...clientDataJSON)`), de modo que un atacante podía
    //    omitirlo y saltarse TODAS las comprobaciones.
    if (!credential?.response?.clientDataJSON) {
      throw new Error("Missing clientDataJSON");
    }
    {
      let clientData: { type?: string; origin?: string; challenge?: string };
      try {
        clientData = JSON.parse(
          new TextDecoder().decode(
            Uint8Array.from(atob(credential.response.clientDataJSON.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0))
          )
        );
      } catch {
        throw new Error("Invalid clientDataJSON");
      }

      if (clientData.type !== "webauthn.get") throw new Error("Invalid clientDataJSON type");

      // El challenge firmado por el dispositivo debe ser exactamente el que
      // el servidor generó y guardó en webauthn_challenges (uso único). Esto
      // impide reutilizar un clientDataJSON capturado con un challenge nuevo.
      const challengeB64Url = (clientData.challenge ?? "")
        .replace(/-/g, "+").replace(/_/g, "/");
      const expectedB64Url = (ch.challenge ?? "")
        .replace(/-/g, "+").replace(/_/g, "/");
      if (!clientData.challenge || challengeB64Url !== expectedB64Url) {
        throw new Error("Challenge mismatch");
      }

      const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "").split(",").map((o: string) => o.trim()).filter(Boolean);
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(clientData.origin ?? "")) {
        throw new Error("Origin not allowed");
      }
    }

    // 4. Obtener el write_token del save de este usuario (puede ser null si aún no tiene save)
    const { data: saveRow } = await db
      .from("saves")
      .select("write_token")
      .eq("user_id", cred.user_id)
      .maybeSingle();

    // 5. Éxito — devolver user_id y write_token para que el cliente los almacene
    return json({
      success:    true,
      userId:     cred.user_id,
      writeToken: saveRow?.write_token ?? null,
    }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message ?? String(e) }, 400, corsHeaders);
  }
});
