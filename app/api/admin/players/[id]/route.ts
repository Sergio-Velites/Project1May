import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/admin/players/[id] → devuelve el game_state completo para el editor
export async function GET(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const db = getAdminDb();
    const { data, error } = await db
      .from('saves')
      .select('game_state')
      .eq('user_id', id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 });

    return NextResponse.json({ gameState: data.game_state });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// PUT /api/admin/players/[id] → actualiza el game_state completo
export async function PUT(req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const { gameState } = await req.json();
    if (!gameState || typeof gameState !== 'object' || Array.isArray(gameState)) {
      return NextResponse.json({ error: 'gameState es requerido y debe ser un objeto' }, { status: 400 });
    }

    // Validación básica (mismas reglas que save-game edge function)
    const gs = gameState as Record<string, unknown>;
    if (Array.isArray(gs.pokemon)) {
      if (gs.pokemon.length > 6)
        return NextResponse.json({ error: 'Máximo 6 Pokémon en el equipo' }, { status: 400 });
      for (const p of gs.pokemon as { level?: number; id?: number }[]) {
        if (typeof p.level === 'number' && (p.level < 1 || p.level > 100))
          return NextResponse.json({ error: 'Nivel de Pokémon fuera de rango (1-100)' }, { status: 400 });
        if (typeof p.id === 'number' && (p.id < 1 || p.id > 251))
          return NextResponse.json({ error: 'ID de Pokémon inválido (1-251)' }, { status: 400 });
      }
    }
    if (typeof gs.money === 'number' && (gs.money < 0 || gs.money > 999999))
      return NextResponse.json({ error: 'Dinero fuera de rango (0-999999)' }, { status: 400 });

    const db = getAdminDb();
    const { error } = await db
      .from('saves')
      .update({ game_state: gameState, updated_at: new Date().toISOString() })
      .eq('user_id', id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ updated: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/admin/players/[id] → elimina el usuario y todo su historial
// ON DELETE CASCADE cubre: saves, webauthn_credentials, rsvp, webauthn_challenges
export async function DELETE(_req: Request, ctx: RouteContext) {
  const { id } = await ctx.params;
  try {
    const db = getAdminDb();
    const { error } = await db
      .from('wedding_users')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ deleted: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
