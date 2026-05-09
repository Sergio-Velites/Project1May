import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@10";
import { Buffer } from "node:buffer";
import { corsHeaders } from "../_shared/cors.ts";
import { db, RP_ID, RP_ORIGIN, encodeBase64Url, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { challengeId, userId, credential } = await req.json();

    const { data: ch, error: chErr } = await db
      .from("webauthn_challenges")
      .select("challenge, used, expires_at")
      .eq("id", challengeId)
      .single();
    if (chErr || !ch) throw new Error("Challenge not found");
    if (ch.used) throw new Error("Challenge already used");
    if (new Date(ch.expires_at) < new Date()) throw new Error("Challenge expired");

    await db.from("webauthn_challenges").update({ used: true }).eq("id", challengeId);

    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: ch.challenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: false,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new Error("Verification failed");
    }

    const info = verification.registrationInfo;
    // En @simplewebauthn/server@10, credentialID es Uint8Array (no string).
    // En v11+ está en info.credential.id como string. Manejamos ambos.
    const rawId = (info as any).credential?.id ?? (info as any).credentialID ?? (info as any).credentialId;
    const credentialId: string = typeof rawId === "string"
      ? rawId
      : Buffer.from(rawId as Uint8Array).toString("base64url");
    const credentialPublicKey: Uint8Array = (info as any).credential?.publicKey ?? (info as any).credentialPublicKey;
    const credentialCounter: number = (info as any).credential?.counter ?? (info as any).counter ?? 0;

    if (!credentialId || !credentialPublicKey) {
      throw new Error("Missing credential data in registrationInfo: " + JSON.stringify(Object.keys(info)));
    }

    const encodedPublicKey = encodeBase64Url(credentialPublicKey);

    // Si el credential ya existe, ACTUALIZAR la public_key (puede haberse guardado
    // incorrectamente en un deploy anterior) y devolver el user_id existente.
    const { data: existing } = await db
      .from("webauthn_credentials")
      .select("user_id")
      .eq("credential_id", credentialId)
      .maybeSingle();

    if (existing) {
      await db.from("webauthn_credentials")
        .update({ public_key: encodedPublicKey, sign_count: credentialCounter })
        .eq("credential_id", credentialId);
      return json({ success: true, userId: existing.user_id }, 200, corsHeaders);
    }

    const { error: credErr } = await db.from("webauthn_credentials").insert({
      credential_id: credentialId,
      user_id: userId,
      public_key: encodedPublicKey,
      sign_count: credentialCounter,
    });
    if (credErr) throw credErr;

    return json({ success: true, userId }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 400, corsHeaders);
  }
});
