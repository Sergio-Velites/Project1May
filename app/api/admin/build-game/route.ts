import { NextResponse } from 'next/server';

/**
 * Dispara el workflow `build-game.yml` (workflow_dispatch) que recompila el
 * bundle del juego desde game-src y lo commitea en la rama de edición. Permite
 * "compilar el juego" online desde el Map Editor, sin entrar al entorno dev.
 *
 * Requiere GH_TOKEN con permiso actions:write. Degrada limpio si falta.
 *   GH_REPO         → owner/repo (def. Sergio-Velites/Project1May)
 *   GH_WORKFLOW_REF → rama donde vive el workflow (def. master)
 *   MAP_EDIT_BRANCH → rama a compilar y commitear (def. map-editor)
 */

const GH_API = 'https://api.github.com';

export async function POST() {
  try {
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
    if (!token) {
      return NextResponse.json({ ok: false, configured: false, error: 'GH_TOKEN no configurado.' });
    }
    const repo = process.env.GH_REPO || 'Sergio-Velites/Project1May';
    const workflowRef = process.env.GH_WORKFLOW_REF || 'master';
    const buildBranch = process.env.MAP_EDIT_BRANCH || 'map-editor';

    const res = await fetch(`${GH_API}/repos/${repo}/actions/workflows/build-game.yml/dispatches`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ref: workflowRef, inputs: { ref: buildBranch } }),
    });

    if (res.status === 204) {
      return NextResponse.json({ ok: true, branch: buildBranch });
    }
    const txt = await res.text().catch(() => '');
    return NextResponse.json(
      { ok: false, error: `No se pudo lanzar el build: HTTP ${res.status} ${txt.slice(0, 200)}` },
      { status: 502 },
    );
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
