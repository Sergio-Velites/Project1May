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

type OverrideKey =
  | 'texts'
  | 'items'
  | 'gifts'
  | 'fences'
  | 'grass'
  | 'pokemonCenter'
  | 'pc'
  | 'store'
  | 'recoverLocation';

const OVERRIDE_KEYS: OverrideKey[] = [
  'texts',
  'items',
  'gifts',
  'fences',
  'grass',
  'pokemonCenter',
  'pc',
  'store',
  'recoverLocation',
];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function applyOverridesToBase(
  target: Record<string, unknown>,
  overrides: unknown
) {
  if (!isPlainObject(overrides)) return;
  for (const key of OVERRIDE_KEYS) {
    if (!(key in overrides)) continue;
    const val = (overrides as Record<string, unknown>)[key];
    if (val === null || val === undefined) continue;
    target[key] = val;
  }
}

export async function GET() {
  try {
    const base = readBundledData();

    const supabase = getSupabase();
    const { data: rows } = await supabase
      .from('map_editor_data')
      .select('map_id, trainers, walls, overrides');

    if (rows) {
      for (const row of rows) {
        if (!base[row.map_id]) continue;
        const target = base[row.map_id] as Record<string, unknown>;

        if (row.trainers !== null && row.trainers !== undefined) {
          target.trainers = row.trainers;
        }
        if (row.walls !== null && row.walls !== undefined) {
          if (
            typeof row.walls === 'object' &&
            Object.keys(row.walls as object).length > 0
          ) {
            target.walls = row.walls;
          }
        }
        if (row.overrides !== null && row.overrides !== undefined) {
          applyOverridesToBase(target, row.overrides);
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
    const { mapId, trainers, walls, overrides } = body as {
      mapId?: string;
      trainers?: unknown;
      walls?: unknown;
      overrides?: Partial<Record<OverrideKey, unknown>>;
    };
    if (!mapId) {
      return NextResponse.json({ error: 'mapId requerido' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from('map_editor_data')
      .select('trainers, walls, overrides')
      .eq('map_id', mapId)
      .maybeSingle();

    // Merge parcial de overrides: las claves enviadas sustituyen, las no
    // enviadas conservan su valor anterior. Para borrar una clave concreta
    // enviar `null` explícito en esa clave.
    const mergedOverrides: Record<string, unknown> = isPlainObject(
      existing?.overrides
    )
      ? { ...(existing!.overrides as Record<string, unknown>) }
      : {};

    if (overrides && isPlainObject(overrides)) {
      for (const key of OVERRIDE_KEYS) {
        if (!(key in overrides)) continue;
        const val = overrides[key];
        if (val === null) {
          delete mergedOverrides[key];
        } else {
          mergedOverrides[key] = val;
        }
      }
    }

    const payload: Record<string, unknown> = {
      map_id: mapId,
      trainers: trainers !== undefined ? trainers : existing?.trainers ?? [],
      walls: walls !== undefined ? walls : existing?.walls ?? {},
      overrides: mergedOverrides,
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
