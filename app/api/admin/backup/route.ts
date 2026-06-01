import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Middleware ya garantiza que solo el admin con cookie válida llega aquí.
// Usamos service_role para leer/escribir por encima del RLS.
function getAdminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// GET /api/admin/backup → descarga JSON con todas las partidas y RSVPs
export async function GET() {
  try {
    const db = getAdminDb();

    const [savesRes, rsvpRes] = await Promise.all([
      db.from('saves')
        .select('user_id, game_state, write_token, updated_at')
        .order('updated_at', { ascending: false }),
      db.from('rsvp')
        .select('*')
        .order('created_at', { ascending: true }),
    ]);

    if (savesRes.error) throw new Error(savesRes.error.message);
    if (rsvpRes.error)  throw new Error(rsvpRes.error.message);

    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      saves: (savesRes.data ?? []).map(row => ({
        userId:     row.user_id,
        gameState:  row.game_state,
        writeToken: row.write_token,
        updatedAt:  row.updated_at,
      })),
      rsvp: (rsvpRes.data ?? []).map(row => ({
        userId:      row.user_id,
        playerName:  row.player_name,
        companion:   row.companion,
        children:    row.children,
        allergies:   row.allergies,
        busOutbound: row.bus_outbound,
        busReturn:   row.bus_return,
        preboda:     row.preboda,
        attended:    row.attended,
        createdAt:   row.created_at,
        updatedAt:   row.updated_at,
      })),
    };

    const date     = new Date().toISOString().slice(0, 10);
    const filename = `weddingboy-backup-${date}.json`;

    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/backup → restaura datos desde un fichero de backup
// Hace upsert de cada partida y RSVP — no elimina registros existentes.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body || body.version !== 1 || !Array.isArray(body.saves)) {
      return NextResponse.json(
        { error: 'Formato de backup inválido (se espera { version: 1, saves: [...] })' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const TOKEN_RE = /^[0-9a-f]{64}$/;
    let restoredSaves = 0;
    let restoredRsvp  = 0;
    const errors: string[] = [];

    // ── Restaurar partidas ──────────────────────────────────────────────────
    for (const save of body.saves) {
      if (!save?.userId || typeof save.userId !== 'string') continue;
      if (!save.gameState || typeof save.gameState !== 'object')  continue;

      // Asegurar que el usuario existe (idempotente)
      await db.from('wedding_users')
        .upsert({ id: save.userId }, { onConflict: 'id', ignoreDuplicates: true });

      // Usar el write_token del backup si es válido, o generar uno nuevo
      const writeToken: string = typeof save.writeToken === 'string' && TOKEN_RE.test(save.writeToken)
        ? save.writeToken
        : randomBytes(32).toString('hex');

      const { error } = await db.from('saves').upsert({
        user_id:    save.userId,
        game_state: save.gameState,
        write_token: writeToken,
        updated_at: save.updatedAt ?? new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (error) errors.push(`save ${save.userId}: ${error.message}`);
      else restoredSaves++;
    }

    // ── Restaurar RSVPs ─────────────────────────────────────────────────────
    if (Array.isArray(body.rsvp)) {
      for (const rsvp of body.rsvp) {
        if (!rsvp?.userId || typeof rsvp.userId !== 'string') continue;
        if (!rsvp.playerName) continue;

        await db.from('wedding_users')
          .upsert({ id: rsvp.userId }, { onConflict: 'id', ignoreDuplicates: true });

        const { error } = await db.from('rsvp').upsert({
          user_id:     rsvp.userId,
          player_name: rsvp.playerName,
          companion:   rsvp.companion   ?? null,
          children:    rsvp.children    ?? 0,
          allergies:   rsvp.allergies   ?? null,
          bus_outbound: rsvp.busOutbound ?? 'none',
          bus_return:  rsvp.busReturn   ?? 'none',
          preboda:     rsvp.preboda     ?? false,
          attended:    rsvp.attended    ?? true,
          updated_at:  rsvp.updatedAt   ?? new Date().toISOString(),
        }, { onConflict: 'user_id' });

        if (error) errors.push(`rsvp ${rsvp.userId}: ${error.message}`);
        else restoredRsvp++;
      }
    }

    return NextResponse.json({
      restored: { saves: restoredSaves, rsvp: restoredRsvp },
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
