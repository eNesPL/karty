import { NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';
import { searchScryfallCards } from '@/lib/scryfall';

export async function GET(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
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
