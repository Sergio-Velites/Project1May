import { generateRegistrationOptions } from "npm:@simplewebauthn/server@10";
import { corsHeaders } from "../_shared/cors.ts";
import { db, RP_ID, RP_NAME, json } from "../_shared/db.ts";

// ── Token de recuperación firmado ────────────────────────────────────────────
// El panel de admin (que conoce ADMIN_SECRET) firma HMAC-SHA256("recover:<uuid>")
// y lo mete en el link `?recover=<uuid>&rt=<token>`. Así un invitado puede
// AÑADIR una passkey a una cuenta que YA tiene credenciales (recuperación tras
// perder el dispositivo) SIN exponer el secreto: register-start valida el token.
// Conocer un UUID (son públicos vía list-players) NO basta para secuestrar la
// cuenta: hace falta un token firmado por el admin. Debe coincidir con el HMAC
// que calcula el admin en Node (base64url sin padding sobre "recover:<uuid>").
function b64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function recoverTokenFor(userId: string): Promise<string> {
  const secret = Deno.env.get("ADMIN_SECRET") ?? "";
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`recover:${userId}`));
  return b64url(new Uint8Array(sig));
}
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

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
      // Verificar que el usuario existe
      const { data: existingUser } = await db
        .from("wedding_users")
        .select("id")
        .eq("id", providedUserId)
        .maybeSingle();

      if (!existingUser) throw new Error("User not found");

      // Comprobar si ya tiene credenciales activas.
      // Si las tiene, solo permitir el re-registro con ADMIN_SECRET (flujo de recovery
      // legítimo gestionado por el panel de administración). Esto impide que cualquier
      // persona que conozca un UUID ajeno pueda vincular su propia passkey a esa cuenta.
      const { data: existingCreds } = await db
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", providedUserId)
        .limit(1);

      if (existingCreds && existingCreds.length > 0) {
        // Autorización de recuperación: admin-secret directo (panel) O token
        // firmado del link `?recover=<uuid>&rt=<token>` (invitado en su móvil).
        const adminSecret = req.headers.get("x-admin-secret");
        const recoverToken = req.headers.get("x-recover-token");
        const okAdmin = !!adminSecret && adminSecret === Deno.env.get("ADMIN_SECRET");
        const okToken = !!recoverToken && safeEqual(recoverToken, await recoverTokenFor(providedUserId));
        if (!okAdmin && !okToken) {
          throw new Error("Cannot register new passkey for a user with existing credentials");
        }
      }

      // Upsert del usuario (idempotente)
      await db
        .from("wedding_users")
        .upsert({ id: providedUserId }, { onConflict: "id", ignoreDuplicates: true });
      userId = providedUserId;
    } else {
      // Crear usuario anónimo nuevo
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
