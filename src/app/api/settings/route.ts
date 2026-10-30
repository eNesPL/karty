import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PublicSettings } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as unknown as Array<{
      key: string;
      value: string;
    }>;

    const settingsMap: Record<string, string> = {};
    for (const row of rows) {
      settingsMap[row.key] = row.value;
    }

    const publicSettings: PublicSettings = {
      store_title: settingsMap.store_title || 'Karty MTG - Rezerwacje',
      store_subtitle: settingsMap.store_subtitle || 'Wybierz karty i odbierz we wtorek lub czwartek!',
      pickup_days: (settingsMap.pickup_days || 'Wtorek (turniej),Czwartek (commander)')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    return NextResponse.json(publicSettings);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
