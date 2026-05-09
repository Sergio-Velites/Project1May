import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Reescribe / al juego estático sin cambiar la URL visible
  return NextResponse.rewrite(new URL('/game/index.html', request.url));
}

export const config = {
  matcher: '/',
};
