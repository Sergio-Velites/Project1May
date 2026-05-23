import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // ── Protección de rutas /admin/* ────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    // La página de login siempre es accesible
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Verificar cookie de autenticación admin
    const token = request.cookies.get('admin_token')?.value;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const tokenMatches = (() => {
      if (!adminPassword || !token) return false;
      return timingSafeStringEqual(token, adminPassword);
    })();

    if (!tokenMatches) {
      // Redirigir al login con la URL original como retorno
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
  matcher: ['/', '/admin/:path*'],
};
