import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createHash } from 'crypto';

// La cookie almacena SHA-256(ADMIN_PASSWORD), nunca el texto plano.
// Al cambiar la contraseña en Vercel + redeploy, el hash cambia y
// las cookies antiguas quedan invalidadas automáticamente.
function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex');
}

function timingSafeStringEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.length !== bBytes.length) return false;

  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Protección de rutas /admin/* y /api/admin/* ─────────────────────────
  const isAdminPage = pathname.startsWith('/admin');
  const isAdminApi  = pathname.startsWith('/api/admin');

  if (isAdminPage || isAdminApi) {
    // La página de login siempre es accesible
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Verificar cookie de autenticación admin
    const token = request.cookies.get('admin_token')?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const tokenMatches = (() => {
      if (!adminPassword || !token) return false;
      return timingSafeStringEqual(token, hashPassword(adminPassword));
    })();

    if (!tokenMatches) {
      // API routes → 401 JSON en lugar de redirect
      if (isAdminApi) {
        return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Páginas → redirigir al login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
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
