import { verifyRegistrationResponse } from "npm:@simplewebauthn/server@10";
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

    const { credential: cred } = verification.registrationInfo;

    const { error: credErr } = await db.from("webauthn_credentials").insert({
      credential_id: cred.id,
      user_id: userId,
      public_key: encodeBase64Url(cred.publicKey),
      sign_count: cred.counter,
    });
    if (credErr) throw credErr;

    return json({ success: true, userId }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 400, corsHeaders);
  }
});
