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
      .select('map_id, trainers');

    if (rows) {
      for (const row of rows) {
        if (base[row.map_id]) {
          (base[row.map_id] as Record<string, unknown>).trainers = row.trainers;
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
    const { mapId, trainers } = await request.json();
    if (!mapId) {
      return NextResponse.json({ error: 'mapId requerido' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('map_editor_data')
      .upsert({ map_id: mapId, trainers, updated_at: new Date().toISOString() });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
