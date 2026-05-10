import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const DATA_PATH = path.join(process.cwd(), 'public/editor/map-data.json');

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function readBundledData(): Record<string, unknown> {
  if (!fs.existsSync(DATA_PATH)) return {};
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

export async function GET() {
  try {
    const base = readBundledData();

    // Overlay with any saved overrides from Supabase
    const supabase = getSupabase();
    const { data: rows } = await supabase
      .from('map_editor_data')
      .select('map_id, trainers, walls');

    if (rows) {
      for (const row of rows) {
        if (base[row.map_id]) {
          const target = base[row.map_id] as Record<string, unknown>;
          if (row.trainers !== null && row.trainers !== undefined) {
            target.trainers = row.trainers;
          }
          if (row.walls !== null && row.walls !== undefined) {
            // Sólo aplicar overlay si el bloque de walls guardado no está vacío.
            if (typeof row.walls === 'object' && Object.keys(row.walls).length > 0) {
              target.walls = row.walls;
            }
          }
        }
      }
    }

    return NextResponse.json(base);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mapId, trainers, walls } = body as {
      mapId?: string;
      trainers?: unknown;
      walls?: unknown;
    };
    if (!mapId) {
      return NextResponse.json({ error: 'mapId requerido' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Lectura del row existente para preservar los campos no enviados.
    const { data: existing } = await supabase
      .from('map_editor_data')
      .select('trainers, walls')
      .eq('map_id', mapId)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      map_id: mapId,
      trainers: trainers !== undefined ? trainers : existing?.trainers ?? [],
      walls: walls !== undefined ? walls : existing?.walls ?? {},
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('map_editor_data').upsert(payload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
