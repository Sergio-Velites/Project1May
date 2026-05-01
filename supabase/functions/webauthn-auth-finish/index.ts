import { verifyAuthenticationResponse } from "npm:@simplewebauthn/server@10";
import { corsHeaders } from "../_shared/cors.ts";
import { db, RP_ID, RP_ORIGIN, decodeBase64Url, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { challengeId, credential } = await req.json();

    const { data: ch, error: chErr } = await db
      .from("webauthn_challenges")
      .select("challenge, used, expires_at")
      .eq("id", challengeId)
      .single();
    if (chErr || !ch) throw new Error("Challenge not found");
    if (ch.used) throw new Error("Challenge already used");
    if (new Date(ch.expires_at) < new Date()) throw new Error("Challenge expired");

    // Mark used immediately to prevent replay
    await db.from("webauthn_challenges").update({ used: true }).eq("id", challengeId);

    const { data: cred, error: credErr } = await db
      .from("webauthn_credentials")
      .select("user_id, public_key, sign_count")
      .eq("credential_id", credential.id)
      .single();
    if (credErr || !cred) throw new Error("Credential not found");

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: ch.challenge,
      expectedOrigin: RP_ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.id,
        publicKey: decodeBase64Url(cred.public_key),
        counter: cred.sign_count,
      },
      requireUserVerification: false,
    });

    if (!verification.verified) throw new Error("Authentication failed");

    await db
      .from("webauthn_credentials")
      .update({ sign_count: verification.authenticationInfo.newCounter })
      .eq("credential_id", credential.id);

    return json({ success: true, userId: cred.user_id }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 400, corsHeaders);
  }
});
