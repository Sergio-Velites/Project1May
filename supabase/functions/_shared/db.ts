import { createClient } from "npm:@supabase/supabase-js@2";
import { Buffer } from "node:buffer";

export const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export const RP_ID     = Deno.env.get("RP_ID")     ?? "game.bodasym26.es";
export const RP_NAME   = Deno.env.get("RP_NAME")   ?? "La Boda";
export const RP_ORIGIN = Deno.env.get("RP_ORIGIN") ?? "https://game.bodasym26.es";

// Buffer (Node.js compat disponible en Deno/Supabase Edge) maneja base64url
// sin necesidad de padding y sin depender de atob/btoa estrictos.
export function encodeBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function decodeBase64Url(str: string): Uint8Array {
  return new Uint8Array(Buffer.from(str, "base64url"));
}

export function json(data: unknown, status = 200, extra?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}
