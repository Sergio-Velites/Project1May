import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ⚠️ El middleware corre en Edge Runtime (NO Node.js).
// `import { createHash } from 'crypto'` no existe en Edge → usar Web Crypto API.
// La cookie almacena SHA-256(ADMIN_PASSWORD) en hex; al cambiar la contraseña
// en Vercel + redeploy el hash cambia y las cookies antiguas quedan invalidadas.
async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protección de rutas /admin/* y /api/admin/* ─────────────────────────
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi  = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    // Rutas siempre accesibles sin autenticación
    if (pathname === '/admin/login')   return NextResponse.next();
    if (pathname === '/api/admin/auth') return NextResponse.next(); // endpoint de login

    // Verificar cookie de autenticación admin
    const token         = request.cookies.get('admin_token')?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const tokenMatches =
      !!adminPassword && !!token &&
      timingSafeStringEqual(token, await hashPassword(adminPassword));

    if (!tokenMatches) {
      if (isAdminApi) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    return NextResponse.next();
  }

  // ── Reescritura de / → juego estático ──────────────────────────────────
  if (pathname === '/') {
    return NextResponse.rewrite(new URL('/game/index.html', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/admin/:path*', '/api/admin/:path*'],
};
