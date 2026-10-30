import { NextResponse } from 'next/server';
import { verifyAdminPin } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { pin } = await request.json();
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Nieprawidłowy kod PIN.' }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: 'Autoryzacja udana.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
