import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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
      const a = Buffer.from(token.padEnd(adminPassword.length));
      const b = Buffer.from(adminPassword);
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
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
