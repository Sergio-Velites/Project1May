// Proxy hacia la Edge Function admin-backup.
// Toda la lógica vive en Supabase (que ya tiene SUPABASE_SERVICE_ROLE_KEY).
// Aquí solo añadimos el ADMIN_SECRET al header y redirigimos la petición.
import { NextResponse } from 'next/server';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_SECRET  = process.env.ADMIN_SECRET!;

function edgeHeaders(): Record<string, string> {
  return {
    'Content-Type':  'application/json',
    'apikey':        ANON_KEY,
    'Authorization': `Bearer ${ANON_KEY}`,
    'x-admin-key':   ADMIN_SECRET,
  };
}

// GET /api/admin/backup → descarga JSON de todas las partidas + RSVPs
export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-backup`, {
      headers: edgeHeaders(),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    const date = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="weddingboy-backup-${date}.json"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// POST /api/admin/backup → restaura desde un fichero de backup
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const res  = await fetch(`${SUPABASE_URL}/functions/v1/admin-backup`, {
      method:  'POST',
      headers: edgeHeaders(),
      body:    JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
