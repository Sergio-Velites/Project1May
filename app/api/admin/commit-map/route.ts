import { NextResponse } from 'next/server';
import { writeMapTs, type MapWriteState } from '../../../admin/map-editor/ts-codegen';

/**
 * Guardado REAL al código fuente: reescribe game-src/src/maps/<sourceFile> con
 * los cambios del editor (vía writeMapTs, que conserva todo lo no gestionado y
 * arregla los imports) y lo COMMITEA a una rama de GitHub. Así no hay que
 * copiar/pegar ni arreglar imports a mano.
 *
 * Requiere configurar en el entorno (Vercel):
 *   GH_TOKEN          → PAT fine-grained con contents:write sobre el repo.
 *   GH_REPO           → "owner/repo" (por defecto Sergio-Velites/Project1May).
 *   MAP_EDIT_BRANCH   → rama destino (por defecto "map-editor").
 *
 * Si GH_TOKEN no está configurado, NO es un error: devuelve { configured:false }
 * para que el editor lo indique y siga funcionando el guardado en Supabase.
 */

const GH_API = 'https://api.github.com';
const SAFE_FILE = /^[A-Za-z0-9_-]+\.ts$/;

function ghHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

function b64encode(s: string): string {
  return Buffer.from(s, 'utf-8').toString('base64');
}
function b64decode(s: string): string {
  return Buffer.from(s, 'base64').toString('utf-8');
}

async function ensureBranch(repo: string, token: string, branch: string, base: string): Promise<void> {
  const h = ghHeaders(token);
  const refRes = await fetch(`${GH_API}/repos/${repo}/git/ref/heads/${encodeURIComponent(branch)}`, { headers: h });
  if (refRes.ok) return; // ya existe
  if (refRes.status !== 404) {
    throw new Error(`No se pudo comprobar la rama ${branch}: HTTP ${refRes.status}`);
  }
  // Crear la rama desde `base`.
  const baseRes = await fetch(`${GH_API}/repos/${repo}/git/ref/heads/${encodeURIComponent(base)}`, { headers: h });
  if (!baseRes.ok) throw new Error(`No se encontró la rama base ${base}: HTTP ${baseRes.status}`);
  const baseJson = await baseRes.json();
  const sha = baseJson?.object?.sha;
  if (!sha) throw new Error(`La rama base ${base} no tiene SHA`);
  const create = await fetch(`${GH_API}/repos/${repo}/git/refs`, {
    method: 'POST',
    headers: h,
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
  if (!create.ok && create.status !== 422 /* ya existe (carrera) */) {
    throw new Error(`No se pudo crear la rama ${branch}: HTTP ${create.status}`);
  }
}

export async function POST(request: Request) {
  try {
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
    if (!token) {
      return NextResponse.json({ ok: false, configured: false, error: 'GH_TOKEN no configurado en el entorno.' });
    }
    const repo = process.env.GH_REPO || 'Sergio-Velites/Project1May';
    const branch = process.env.MAP_EDIT_BRANCH || 'master';
    const baseBranch = process.env.MAP_EDIT_BASE || 'master';

    const body = await request.json();
    const { sourceFile, state, mapId } = body as {
      sourceFile?: string;
      state?: MapWriteState;
      mapId?: string;
    };
    if (!sourceFile || !SAFE_FILE.test(sourceFile)) {
      return NextResponse.json({ ok: false, error: 'sourceFile inválido' }, { status: 400 });
    }
    if (!state || typeof state !== 'object') {
      return NextResponse.json({ ok: false, error: 'state requerido' }, { status: 400 });
    }

    const repoPath = `game-src/src/maps/${sourceFile}`;
    const h = ghHeaders(token);

    await ensureBranch(repo, token, branch, baseBranch);

    // Leer el archivo actual de la rama destino.
    const getRes = await fetch(
      `${GH_API}/repos/${repo}/contents/${encodeURIComponent(repoPath)}?ref=${encodeURIComponent(branch)}`,
      { headers: h },
    );
    if (!getRes.ok) {
      return NextResponse.json(
        { ok: false, error: `No se pudo leer ${repoPath} en ${branch}: HTTP ${getRes.status}` },
        { status: 502 },
      );
    }
    const getJson = await getRes.json();
    const currentSha: string = getJson.sha;
    const currentText = b64decode(getJson.content ?? '');

    // Reescritura quirúrgica + imports.
    const result = writeMapTs(currentText, state);
    if (!result.ok || !result.text) {
      return NextResponse.json(
        { ok: false, error: `Generación abortada (sin tocar el archivo): ${result.error}` },
        { status: 422 },
      );
    }

    // Si no hay cambios reales, no commitear.
    if (result.text === currentText) {
      return NextResponse.json({ ok: true, branch, unchanged: true, warnings: result.warnings });
    }

    const putRes = await fetch(`${GH_API}/repos/${repo}/contents/${encodeURIComponent(repoPath)}`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({
        message: `editor: actualizar mapa ${mapId ?? sourceFile}`,
        content: b64encode(result.text),
        sha: currentSha,
        branch,
      }),
    });
    if (!putRes.ok) {
      const errText = await putRes.text().catch(() => '');
      return NextResponse.json(
        { ok: false, error: `Commit falló: HTTP ${putRes.status} ${errText.slice(0, 200)}` },
        { status: 502 },
      );
    }
    const putJson = await putRes.json();
    return NextResponse.json({
      ok: true,
      branch,
      commitUrl: putJson?.commit?.html_url ?? null,
      commitSha: putJson?.commit?.sha ?? null,
      warnings: result.warnings,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
