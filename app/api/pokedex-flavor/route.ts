/**
 * API público (sin auth) para que el juego cargue overrides de la Pokédex.
 *
 * Devuelve { overrides: Record<id, flavor> } con SOLO los overrides
 * (flavor !== base). El juego ya tiene el JSON base bundleado; solo
 * necesita los overrides para fusionarlos en runtime.
 *
 * Si Supabase no está disponible o no hay overrides, devuelve {} → el juego
 * usa el JSON base sin más.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; // cachea 1 minuto en CDN

export async function GET() {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ overrides: {} });
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const res = await supabase
      .from('pokedex_flavor')
      .select('pokemon_id, flavor_es');
    if (res.error) {
      return NextResponse.json({ overrides: {} });
    }
    const overrides: Record<string, string> = {};
    for (const row of res.data ?? []) {
      overrides[String(row.pokemon_id as number)] = (row.flavor_es as string) ?? '';
    }
    return NextResponse.json({ overrides });
  } catch {
    return NextResponse.json({ overrides: {} });
  }
}
