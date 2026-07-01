/**
 * /api/admin/maintenance — alterna el modo mantenimiento del juego.
 * Protegido por el middleware (cookie de admin). Reenvía a la edge function
 * `maintenance` añadiendo el ADMIN_SECRET del servidor (que nunca llega al
 * navegador). GET devuelve el estado actual; POST { maintenance, message? } lo fija.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "";

export async function GET() {
  try {
    const r = await fetch(`${SUPABASE_URL}/functions/v1/maintenance`, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
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
    const r = await fetch(`${SUPABASE_URL}/functions/v1/maintenance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON,
        Authorization: `Bearer ${ANON}`,
        "x-admin-secret": ADMIN_SECRET,
      },
      body: JSON.stringify({
        maintenance: !!body.maintenance,
        ...(typeof body.message === "string" ? { message: body.message } : {}),
      }),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
