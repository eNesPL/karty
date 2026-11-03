import { NextResponse } from 'next/server';
import { searchScryfallCards } from '@/lib/scryfall';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.trim();

    if (!name || name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { error: 'Podaj prawidłową nazwę karty.' },
        { status: 400 }
      );
    }

    const escapedName = name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const printings = await searchScryfallCards(`!"${escapedName}"`);

    return NextResponse.json({ printings });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
