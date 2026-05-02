import { generateAuthenticationOptions } from "npm:@simplewebauthn/server@10";
import { corsHeaders } from "../_shared/cors.ts";
import { db, RP_ID, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    await db.rpc("cleanup_webauthn_challenges");

    const { credentialId } = await req.json();

    const allowCredentials = credentialId
      ? [{ id: credentialId, type: "public-key" as const }]
      : [];

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials,
      userVerification: "preferred",
    });

    const { data: ch, error: chErr } = await db
      .from("webauthn_challenges")
      .insert({ challenge: options.challenge })
      .select("id")
      .single();
    if (chErr) throw chErr;

    return json({ challengeId: ch.id, options }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
