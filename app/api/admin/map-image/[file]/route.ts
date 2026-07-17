import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

/**
 * Sirve las imágenes de mapa desde la única fuente del proyecto:
 * `game-src/src/assets/map/` (la misma que compila el juego). Así el editor y
 * el juego comparten exactamente el mismo PNG por mapa — no hay copia en
 * `public/editor/maps/` que pueda desincronizarse.
 *
 * Override de subida: si el editor reemplazó el PNG (tabla Supabase
 * `map_editor_images`, escrita por /api/admin/upload-map-image), se sirve esa
 * copia — el filesystem del lambda no refleja el commit a GitHub hasta el
 * siguiente deploy. Mismo patrón preview que map_editor_data.overrides.
 *
 * Seguridad: solo se permiten nombres de fichero PNG simples (sin rutas ni
 * `..`) para evitar path traversal.
 */

const MAP_ASSETS_DIR = path.join(process.cwd(), 'game-src', 'src', 'assets', 'map');
const SAFE_NAME = /^[A-Za-z0-9_-]+\.png$/;

function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/**
 * Override de subida con AUTO-LIMPIEZA: si los bytes del filesystem ya
 * coinciden con el override (el deploy posterior al commit ya lo incluye),
 * se borra la fila y se sirve el filesystem. Así el override nunca puede
 * "tapar" una edición manual futura del PNG en el repo (la trampa clásica
 * de los overrides de map_editor_data).
 */
async function fetchUploadedOverride(file: string, fsBuf: Buffer | null): Promise<Buffer | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('map_editor_images')
      .select('content_b64')
      .eq('file', file)
      .maybeSingle();
    if (error || !data?.content_b64) return null;
    const uploaded = Buffer.from(data.content_b64, 'base64');
    if (fsBuf && fsBuf.equals(uploaded)) {
      // El repo desplegado ya lleva esta imagen → el override sobra.
      supabase.from('map_editor_images').delete().eq('file', file).then(
        () => {},
        () => {},
      );
      return null;
    }
    return uploaded;
  } catch {
    return null; // tabla ausente / red caída → caer al filesystem
  }
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ file: string }> },
) {
  const { file } = await ctx.params;
  if (!file || !SAFE_NAME.test(file)) {
    return new Response('Nombre de imagen inválido', { status: 400 });
  }
  const filePath = path.join(MAP_ASSETS_DIR, file);
  // Defensa extra: el resultado normalizado debe seguir dentro del directorio.
  if (!filePath.startsWith(MAP_ASSETS_DIR + path.sep)) {
    return new Response('Ruta no permitida', { status: 400 });
  }

  let fsBuf: Buffer | null = null;
  try {
    fsBuf = fs.readFileSync(filePath);
  } catch {
    fsBuf = null; // mapa nuevo aún sin PNG en el deploy → puede vivir solo en el override
  }

  const uploaded = await fetchUploadedOverride(file, fsBuf);
  if (uploaded) {
    return new Response(new Uint8Array(uploaded), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        // Corta: el editor cache-busts con ?v= tras subir, pero otros
        // consumidores deben refrescar pronto tras un reemplazo.
        'Cache-Control': 'public, max-age=60, must-revalidate',
      },
    });
  }

  if (fsBuf) {
    return new Response(new Uint8Array(fsBuf), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    });
  }
  return new Response('Imagen no encontrada', { status: 404 });
}
