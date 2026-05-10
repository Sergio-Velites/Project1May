import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10";
import { corsHeaders } from "../_shared/cors.ts";
import { db, RP_ID, RP_NAME, json } from "../_shared/db.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    await db.rpc("cleanup_webauthn_challenges");

    // Si viene `userId` en el body → registrar passkey adicional sobre un user existente
    // (modo "Recuperar partida" desde el admin). Si no, crear nuevo wedding_user anónimo.
    let providedUserId: string | undefined;
    try {
      const body = await req.json();
      if (body && typeof body.userId === "string" && body.userId.length > 0) {
        providedUserId = body.userId;
      }
    } catch {
      // sin body → flujo normal
    }

    let userId: string;

    if (providedUserId) {
      // Asegurar que el row existe en wedding_users (idempotente)
      await db
        .from("wedding_users")
        .upsert({ id: providedUserId }, { onConflict: "id", ignoreDuplicates: true });
      userId = providedUserId;
    } else {
      // Create anonymous user
      const { data: user, error: userErr } = await db
        .from("wedding_users")
        .insert({})
        .select("id")
        .single();
      if (userErr) throw userErr;
      userId = user.id;
    }

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
