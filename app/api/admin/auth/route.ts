import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

// La cookie almacena un hash SHA-256 de la contraseña, nunca el texto plano.
// El middleware compara la cookie contra ese mismo hash.
// Al cambiar ADMIN_PASSWORD en Vercel + redeploy, las cookies antiguas
// dejan de ser válidas automáticamente sin necesidad de invalidarlas manualmente.
function hashPassword(pw: string): string {
  return createHash('sha256').update(pw).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  // Misma longitud → XOR byte a byte (evita timing attacks)
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || !timingSafeEqual(password, adminPassword)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_token', hashPassword(adminPassword), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  });
  return response;
}
