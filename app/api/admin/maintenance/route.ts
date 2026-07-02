/**
 * /api/admin/maintenance — alterna el modo mantenimiento del juego y gestiona
 * la lista de jugadores con acceso durante el mantenimiento.
 * Protegido por el middleware (cookie de admin). Reenvía a la edge function
 * `maintenance` añadiendo el ADMIN_SECRET del servidor (que nunca llega al
 * navegador).
 *  · GET  → { maintenance, message, allowedPlayers }
 *  · GET ?players=1 → además { players: [{playerId,name,pokemonCount}] }
 *    (proxy de `list-players`, para el selector del map-editor)
 *  · POST { maintenance?, message?, allowedPlayers? } → lo fija.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

const fnHeaders: Record<string, string> = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
};

export async function GET(req: NextRequest) {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/maintenance`, {
      headers: { ...fnHeaders, ...(ADMIN_SECRET ? { "x-admin-secret": ADMIN_SECRET } : {}) },
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));

    if (req.nextUrl.searchParams.get("players")) {
      try {
        const pr = await fetch(`${SUPABASE_URL}/functions/v1/list-players`, {
          headers: fnHeaders,
          cache: "no-store",
        });
        const pd = await pr.json().catch(() => ({}));
        data.players = Array.isArray(pd.players) ? pd.players : [];
      } catch {
        data.players = [];
      }
    }
    return NextResponse.json(data, { status: r.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_SECRET) {
      return NextResponse.json({ error: "ADMIN_SECRET no configurado" }, { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const payload: Record<string, unknown> = {};
    if (typeof body.maintenance === "boolean") payload.maintenance = body.maintenance;
    if (typeof body.message === "string") payload.message = body.message;
    if (Array.isArray(body.allowedPlayers)) payload.allowedPlayers = body.allowedPlayers;

    const r = await fetch(`${SUPABASE_URL}/functions/v1/maintenance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...fnHeaders,
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
