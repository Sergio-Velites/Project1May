import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10";
import { corsHeaders } from "../_shared/cors.ts";
import { db, RP_ID, RP_NAME, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    await db.rpc("cleanup_webauthn_challenges");

    // Create anonymous user
    const { data: user, error: userErr } = await db
      .from("wedding_users")
      .insert({})
      .select("id")
      .single();
    if (userErr) throw userErr;

    const userId: string = user.id;

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userName: userId,
      userDisplayName: "Invitado",
      attestation: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      excludeCredentials: [],
    });

    const { data: ch, error: chErr } = await db
      .from("webauthn_challenges")
      .insert({ challenge: options.challenge, user_id: userId })
      .select("id")
      .single();
    if (chErr) throw chErr;

    return json({ challengeId: ch.id, userId, options }, 200, corsHeaders);
  } catch (e) {
    return json({ error: (e as Error).message }, 500, corsHeaders);
  }
});
