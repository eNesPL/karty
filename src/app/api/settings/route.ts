import { NextResponse, connection } from 'next/server';
import { getDb } from '@/lib/db';
import { PublicSettings } from '@/lib/types';

export async function GET() {
  await connection();
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

    const rawPickupDays = settingsMap.pickup_days !== undefined
      ? settingsMap.pickup_days
      : 'Wtorek (turniej),Czwartek (commander)';

    const pickup_days = rawPickupDays
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const publicSettings: PublicSettings = {
      store_title: settingsMap.store_title || 'Karty MTG - Rezerwacje',
      store_subtitle: settingsMap.store_subtitle || 'Wybierz karty i zarezerwuj odbiór!',
      pickup_days: pickup_days.length > 0 ? pickup_days : ['Wtorek', 'Czwartek'],
    };

    return NextResponse.json(publicSettings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
