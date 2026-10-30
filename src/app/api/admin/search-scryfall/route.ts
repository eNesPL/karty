import { NextResponse } from 'next/server';
import { verifyAdminPin } from '@/lib/auth';
import { searchScryfallCards } from '@/lib/scryfall';

export async function GET(request: Request) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    const cards = await searchScryfallCards(q);
    return NextResponse.json({ cards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
