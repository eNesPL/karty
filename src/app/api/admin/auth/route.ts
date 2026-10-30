import { NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = body.password || body.pin;
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Nieprawidłowe hasło.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Autoryzacja udana.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
