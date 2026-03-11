import { NextRequest, NextResponse } from 'next/server';

// Sets admin-auth cookie when the admin panel loads with a valid key.
// The middleware already validated the path key before this page could load,
// so we trust the key and set a cookie for subsequent API calls.
export async function POST(request: NextRequest) {
  const { key } = await request.json();
  const secret = process.env.ADMIN_API_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  // The admin panel key (ADMIN_SECRET_PATH) grants access to set the API cookie
  const pathSecret = process.env.ADMIN_SECRET_PATH;
  if (!pathSecret || key !== pathSecret) {
    return NextResponse.json({ error: 'Invalid' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set('admin-auth', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return response;
}
