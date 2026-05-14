/**
 * API admin para descripciones de Pokédex.
 *
 *   GET  → devuelve [{ id, name, base, override }] para los 151 Gen I.
 *   POST → upsert de { id, flavor }. flavor === "" elimina el override
 *          (vuelve a usar el texto base del JSON empaquetado).
 *
 * Auth: la cookie admin_token la valida el middleware. Cualquier petición
 * que llegue aquí ya está autorizada.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import baseFlavor from '../../../../game-src/src/app/pokedex-flavor-es.json';
import POKEMON_NAMES_GEN1 from '../../../admin/pokemon-names';

const TOTAL = 151;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function nameFor(id: number): string {
  return POKEMON_NAMES_GEN1[id - 1] ?? `#${id}`;
}

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Sin credenciales: devolver solo base, sin overrides
      const entries = Array.from({ length: TOTAL }, (_, i) => {
        const id = i + 1;
        return {
          id,
          name: nameFor(id),
          base: (baseFlavor as Record<string, string>)[String(id)] ?? '',
          override: null as string | null,
        };
      });
      return NextResponse.json({ entries });
    }

    const supabase = getSupabase();
    const res = await supabase
      .from('pokedex_flavor')
      .select('pokemon_id, flavor_es');

    if (res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }

    const overrideMap: Record<number, string> = {};
    for (const row of res.data ?? []) {
      overrideMap[row.pokemon_id as number] = (row.flavor_es as string) ?? '';
    }

    const entries = Array.from({ length: TOTAL }, (_, i) => {
      const id = i + 1;
      const base = (baseFlavor as Record<string, string>)[String(id)] ?? '';
      const override = id in overrideMap ? overrideMap[id] : null;
      return { id, name: nameFor(id), base, override };
    });

    return NextResponse.json({ entries });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
    }
    const { id, flavor } = body as { id?: number; flavor?: string };
    if (typeof id !== 'number' || id < 1 || id > TOTAL) {
      return NextResponse.json({ error: 'id inválido' }, { status: 400 });
    }
    if (typeof flavor !== 'string') {
      return NextResponse.json({ error: 'flavor inválido' }, { status: 400 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ error: 'Supabase no configurado' }, { status: 500 });
    }

    const supabase = getSupabase();
    const baseText = (baseFlavor as Record<string, string>)[String(id)] ?? '';

    // Si el texto enviado coincide exactamente con la base, eliminamos el
    // override (no hace falta guardar lo mismo). Esto mantiene la tabla
    // pequeña y permite ver de un vistazo qué entradas están customizadas.
    if (flavor === baseText) {
      const del = await supabase
        .from('pokedex_flavor')
        .delete()
        .eq('pokemon_id', id);
      if (del.error) {
        return NextResponse.json({ error: del.error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, removed: true });
    }

    const up = await supabase
      .from('pokedex_flavor')
      .upsert({ pokemon_id: id, flavor_es: flavor, updated_at: new Date().toISOString() });
    if (up.error) {
      return NextResponse.json({ error: up.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
