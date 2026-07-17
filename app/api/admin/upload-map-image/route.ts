import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Subida de imágenes de mapa desde el Map Editor (reemplaza el PNG del mapa).
 *
 * Hace DOS cosas (mismo patrón dual que 💾 Guardar):
 *  1. COMMIT a GitHub de `game-src/src/assets/map/<file>` en MAP_EDIT_BRANCH
 *     (def. master) — es la fuente única que compila el juego y usa el editor.
 *  2. UPSERT en Supabase `map_editor_images` — preview instantáneo: el
 *     filesystem del lambda no refleja el commit hasta el siguiente deploy,
 *     así que /api/admin/map-image/<file> sirve primero esta copia.
 *
 * El nombre de fichero NO cambia (se reemplazan los bytes): así el import
 * del .ts del mapa sigue siendo válido sin tocar código.
 *
 * Valida que el contenido es un PNG real (magic bytes) y devuelve sus
 * dimensiones en píxeles leídas del chunk IHDR (para que el editor proponga
 * width/height en tiles = px/16).
 */

const GH_API = 'https://api.github.com';
const SAFE_NAME = /^[A-Za-z0-9_-]+\.png$/;
const MAX_BYTES = 4 * 1024 * 1024; // 4 MB binario (el juego usa PNGs pequeños)
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

/** Dimensiones en px del PNG leyendo el chunk IHDR (offsets fijos del formato). */
function pngDimensions(buf: Buffer): { width: number; height: number } | null {
  if (buf.length < 24) return null;
  for (let i = 0; i < PNG_MAGIC.length; i++) {
    if (buf[i] !== PNG_MAGIC[i]) return null;
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { file, contentBase64 } = body as { file?: string; contentBase64?: string };

    if (!file || !SAFE_NAME.test(file)) {
      return NextResponse.json({ ok: false, error: 'Nombre de imagen inválido (solo <nombre>.png simple).' }, { status: 400 });
    }
    if (!contentBase64 || typeof contentBase64 !== 'string') {
      return NextResponse.json({ ok: false, error: 'contentBase64 requerido.' }, { status: 400 });
    }

    let buf: Buffer;
    try {
      buf = Buffer.from(contentBase64, 'base64');
    } catch {
      return NextResponse.json({ ok: false, error: 'Base64 inválido.' }, { status: 400 });
    }
    if (buf.length === 0 || buf.length > MAX_BYTES) {
      return NextResponse.json({ ok: false, error: `El PNG debe ocupar entre 1 byte y ${MAX_BYTES / 1024 / 1024} MB.` }, { status: 400 });
    }
    const dims = pngDimensions(buf);
    if (!dims) {
      return NextResponse.json({ ok: false, error: 'El archivo no es un PNG válido.' }, { status: 400 });
    }

    const warnings: string[] = [];
    if (dims.width % 16 !== 0 || dims.height % 16 !== 0) {
      warnings.push(`Las dimensiones (${dims.width}×${dims.height}px) no son múltiplo de 16 — los tiles quedarán descuadrados.`);
    }

    // ── 1. Preview instantáneo en Supabase ─────────────────────────────────
    let previewSaved = false;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      );
      const { error } = await supabase.from('map_editor_images').upsert({
        file,
        content_b64: contentBase64,
        updated_at: new Date().toISOString(),
      });
      if (error) {
        warnings.push(`Preview en Supabase no guardado (${error.message}) — aplica 011_map_editor_images.sql. La imagen nueva no se verá en el editor hasta el próximo deploy.`);
      } else {
        previewSaved = true;
      }
    } else {
      warnings.push('Sin credenciales de Supabase: preview instantáneo no disponible.');
    }

    // ── 2. Commit del PNG al repo ──────────────────────────────────────────
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
    if (!token) {
      return NextResponse.json({
        ok: previewSaved,
        configured: false,
        previewSaved,
        pixelWidth: dims.width,
        pixelHeight: dims.height,
        warnings: [...warnings, 'GH_TOKEN no configurado: la imagen NO se commiteó al repo (solo preview).'],
      });
    }
    const repo = process.env.GH_REPO || 'Sergio-Velites/Project1May';
    const branch = process.env.MAP_EDIT_BRANCH || 'master';
    const repoPath = `game-src/src/assets/map/${file}`;
    const h = ghHeaders(token);

    // SHA actual (si el archivo existe) — necesario para reemplazar.
    let currentSha: string | undefined;
    const getRes = await fetch(
      `${GH_API}/repos/${repo}/contents/${encodeURIComponent(repoPath)}?ref=${encodeURIComponent(branch)}`,
      { headers: h },
    );
    if (getRes.ok) {
      const getJson = await getRes.json();
      currentSha = getJson.sha;
    } else if (getRes.status !== 404) {
      return NextResponse.json(
        { ok: false, previewSaved, error: `No se pudo comprobar ${repoPath} en ${branch}: HTTP ${getRes.status}`, warnings },
        { status: 502 },
      );
    }

    const putRes = await fetch(`${GH_API}/repos/${repo}/contents/${encodeURIComponent(repoPath)}`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({
        message: `editor: ${currentSha ? 'reemplazar' : 'añadir'} imagen de mapa ${file}`,
        content: contentBase64,
        ...(currentSha ? { sha: currentSha } : {}),
        branch,
      }),
    });
    if (!putRes.ok) {
      const errText = await putRes.text().catch(() => '');
      return NextResponse.json(
        { ok: false, previewSaved, error: `Commit de la imagen falló: HTTP ${putRes.status} ${errText.slice(0, 200)}`, warnings },
        { status: 502 },
      );
    }
    const putJson = await putRes.json();

    return NextResponse.json({
      ok: true,
      previewSaved,
      branch,
      commitSha: putJson?.commit?.sha ?? null,
      commitUrl: putJson?.commit?.html_url ?? null,
      pixelWidth: dims.width,
      pixelHeight: dims.height,
      warnings,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
