import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin_token', adminPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 días
    path: '/',
  });
  return response;
}
