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
  // En producción (Vercel) el fs.readFileSync puede leer una versión antigua
  // del archivo si el output file tracer no lo re-traza. Usamos require()
  // para que Next.js lo bundlee explícitamente en cada build.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return JSON.parse(JSON.stringify(require('../../../../public/editor/map-data.json')));
  } catch {
    // Fallback: leer desde disco (dev mode o si require falla)
    if (!fs.existsSync(DATA_PATH)) return {};
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  }
}

type OverrideKey =
  | 'texts'
  | 'items'
  | 'gifts'
  | 'staticPokemon'
  | 'fences'
  | 'grass'
  | 'water'
  | 'encounters'
  | 'pokemonCenter'
  | 'pc'
  | 'store'
  | 'recoverLocation'
  | 'maps'
  | 'teleports'
  | 'exits'
  | 'exitReturnMap'
  | 'exitReturnPos';

const OVERRIDE_KEYS: OverrideKey[] = [
  'texts',
  'items',
  'gifts',
  'staticPokemon',
  'fences',
  'grass',
  'water',
  'encounters',
  'pokemonCenter',
  'pc',
  'store',
  'recoverLocation',
  'maps',
  'teleports',
  'exits',
  'exitReturnMap',
  'exitReturnPos',
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
    // `encounters` se MEZCLA con la base en lugar de reemplazarse, para
    // que un override parcial (sólo walk, sólo oldRod, etc.) no borre el
    // resto de tablas (surf, headbutt, etc.) que vienen del JSON original.
    if (key === 'encounters' && isPlainObject(val) && isPlainObject(target.encounters)) {
      target.encounters = { ...(target.encounters as Record<string, unknown>), ...val };
      continue;
    }
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
    let res = await supabase
      .from('map_editor_data')
      .select('map_id, trainers, walls, overrides');

    if (res.error && /column .*overrides.* does not exist/i.test(res.error.message)) {
      stage = 'select(no overrides)';
      res = await supabase
        .from('map_editor_data')
        .select('map_id, trainers, walls');
    }
    if (res.error && /column .*walls.* does not exist/i.test(res.error.message)) {
      stage = 'select(no walls)';
      res = await supabase
        .from('map_editor_data')
        .select('map_id, trainers');
    }
    if (res.error) {
      console.error('[map-data][GET] select error:', res.error);
      // No devolvemos 500 para no romper el editor: solo bundle.
      return NextResponse.json(base);
    }
    rows = (res.data ?? []) as Array<Record<string, unknown>>;

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

    // Intento de leer fila existente con todas las columnas; si alguna no
    // existe (migraciones 003/004 no aplicadas), reintentamos con el
    // subconjunto disponible para no romper.
    type ExistingRow = { trainers?: unknown; walls?: unknown; overrides?: unknown };
    let existing: ExistingRow | null = null;
    let overridesColumnAvailable = true;
    let wallsColumnAvailable = true;

    async function trySelect(cols: string) {
      return supabase
        .from('map_editor_data')
        .select(cols)
        .eq('map_id', mapId)
        .maybeSingle();
    }

    {
      let r = await trySelect('trainers, walls, overrides');
      if (r.error && /column .*overrides.* does not exist/i.test(r.error.message)) {
        overridesColumnAvailable = false;
        r = await trySelect('trainers, walls');
      }
      if (r.error && /column .*walls.* does not exist/i.test(r.error.message)) {
        wallsColumnAvailable = false;
        r = await trySelect('trainers');
      }
      if (r.error) {
        console.error('[map-data][POST] select error:', r.error);
        return NextResponse.json(
          { error: `supabase select: ${r.error.message}` },
          { status: 500 },
        );
      }
      existing = (r.data ?? null) as ExistingRow | null;
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
      updated_at: new Date().toISOString(),
    };
    if (wallsColumnAvailable) {
      payload.walls = walls !== undefined ? walls : existing?.walls ?? {};
    }
    if (overridesColumnAvailable) {
      payload.overrides = mergedOverrides;
    }

    const { error } = await supabase.from('map_editor_data').upsert(payload);

    if (error) {
      const missingMigrations: string[] = [];
      if (!wallsColumnAvailable) missingMigrations.push('003_map_editor_walls.sql');
      if (!overridesColumnAvailable) missingMigrations.push('004_map_editor_overrides.sql');
      console.error('[map-data][POST] upsert error:', error);
      return NextResponse.json(
        {
          error: `supabase upsert: ${error.message}`,
          hint: missingMigrations.length
            ? `Aplica en Supabase SQL Editor: ${missingMigrations.join(', ')}`
            : undefined,
        },
        { status: 500 },
      );
    }

    const warnings: string[] = [];
    if (!wallsColumnAvailable)
      warnings.push('Walls no persistidos: aplica 003_map_editor_walls.sql en Supabase.');
    if (!overridesColumnAvailable)
      warnings.push('Overrides no persistidos: aplica 004_map_editor_overrides.sql en Supabase.');

    return NextResponse.json({
      ok: true,
      ...(warnings.length ? { warning: warnings.join(' ') } : {}),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
