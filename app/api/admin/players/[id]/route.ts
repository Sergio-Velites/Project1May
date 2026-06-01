// Proxy hacia la Edge Function admin-player.
// Toda la lógica vive en Supabase (que ya tiene SUPABASE_SERVICE_ROLE_KEY).
import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

function edgeHeaders(): Record<string, string> {
  return {
    'Content-Type':  'application/json',
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'x-admin-key':   ADMIN_SECRET,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/players/[id] → devuelve game_state completo
export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/functions/v1/admin-player?userId=${encodeURIComponent(id)}`,
      { headers: edgeHeaders() }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PUT /api/admin/players/[id] → actualiza game_state
export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const res  = await fetch(`${SUPABASE_URL}/functions/v1/admin-player`, {
      method:  'PUT',
      headers: edgeHeaders(),
      body:    JSON.stringify({ userId: id, ...body }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/admin/players/[id] → elimina jugador (cascade)
export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const res  = await fetch(`${SUPABASE_URL}/functions/v1/admin-player`, {
      method:  'DELETE',
      headers: edgeHeaders(),
      body:    JSON.stringify({ userId: id }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
