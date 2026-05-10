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
  let stage = 'init';
  try {
    stage = 'readBundledData';
    const base = readBundledData();

    stage = 'getSupabase';
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Sin credenciales devolvemos solo lo bundleado (no es error fatal).
      console.warn('[map-data][GET] Sin NEXT_PUBLIC_SUPABASE_URL/KEY — devolviendo solo base bundleada');
      return NextResponse.json(base);
    }
    const supabase = getSupabase();

    stage = 'select(overrides)';
    let rows: Array<Record<string, unknown>> = [];
    const res = await supabase
      .from('map_editor_data')
      .select('map_id, trainers, walls, overrides');

    if (res.error && /column .*overrides.* does not exist/i.test(res.error.message)) {
      stage = 'select(fallback)';
      const fallback = await supabase
        .from('map_editor_data')
        .select('map_id, trainers, walls');
      if (fallback.error) {
        console.error('[map-data][GET] fallback error:', fallback.error);
        // Aún devolvemos los datos bundleados para que el editor cargue.
        return NextResponse.json(base);
      }
      rows = (fallback.data ?? []) as Array<Record<string, unknown>>;
    } else if (res.error) {
      console.error('[map-data][GET] select error:', res.error);
      // No devolvemos 500 para no romper el editor: solo bundle.
      return NextResponse.json(base);
    } else {
      rows = (res.data ?? []) as Array<Record<string, unknown>>;
    }

    stage = 'apply rows';
    for (const row of rows) {
      const mapId = row.map_id as string;
      if (!mapId || !base[mapId]) continue;
      const target = base[mapId] as Record<string, unknown>;

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

    return NextResponse.json(base);
  } catch (e) {
    console.error(`[map-data][GET] crash en ${stage}:`, e);
    return NextResponse.json(
      { error: `${stage}: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
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

    // Intento de leer fila existente con overrides; si la columna no existe
    // hacemos fallback sin overrides para no romper.
    type ExistingRow = { trainers?: unknown; walls?: unknown; overrides?: unknown };
    let existing: ExistingRow | null = null;
    let overridesColumnAvailable = true;

    {
      const { data, error } = await supabase
        .from('map_editor_data')
        .select('trainers, walls, overrides')
        .eq('map_id', mapId)
        .maybeSingle();
      if (error && /column .*overrides.* does not exist/i.test(error.message)) {
        overridesColumnAvailable = false;
        const fb = await supabase
          .from('map_editor_data')
          .select('trainers, walls')
          .eq('map_id', mapId)
          .maybeSingle();
        if (fb.error) {
          return NextResponse.json(
            { error: `supabase select: ${fb.error.message}` },
            { status: 500 },
          );
        }
        existing = (fb.data ?? null) as ExistingRow | null;
      } else if (error) {
        return NextResponse.json(
          { error: `supabase select: ${error.message}` },
          { status: 500 },
        );
      } else {
        existing = (data ?? null) as ExistingRow | null;
      }
    }

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
      updated_at: new Date().toISOString(),
    };
    if (overridesColumnAvailable) {
      payload.overrides = mergedOverrides;
    }

    const { error } = await supabase.from('map_editor_data').upsert(payload);

    if (error) {
      return NextResponse.json(
        {
          error: `supabase upsert: ${error.message}`,
          hint: !overridesColumnAvailable
            ? 'La columna `overrides` no existe en Supabase. Aplica la migración supabase/migrations/004_map_editor_overrides.sql en el SQL Editor del Dashboard.'
            : undefined,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      ...(overridesColumnAvailable
        ? {}
        : { warning: 'Overrides no persistidos: aplica la migración 004_map_editor_overrides.sql en Supabase.' }),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
