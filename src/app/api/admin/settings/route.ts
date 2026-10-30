import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as unknown as Array<{
      key: string;
      value: string;
    }>;

    const settings: Record<string, string> = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }

    if (!settings.admin_password && settings.admin_pin) {
      settings.admin_password = settings.admin_pin;
    }
    if (!settings.admin_pin && settings.admin_password) {
      settings.admin_pin = settings.admin_password;
    }

    return NextResponse.json({ settings });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Nieprawidłowe dane ustawień.' }, { status: 400 });
    }

    const db = getDb();
    const upsertStmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    // Sync admin_password and admin_pin
    if (settings.admin_password) {
      settings.admin_pin = settings.admin_password;
    } else if (settings.admin_pin) {
      settings.admin_password = settings.admin_pin;
    }

    for (const [key, value] of Object.entries(settings)) {
      upsertStmt.run(key, String(value));
    }

    return NextResponse.json({ success: true, message: 'Ustawienia zapisane.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
