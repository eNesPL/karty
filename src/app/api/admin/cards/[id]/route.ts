import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const { id } = await params;
    const cardId = parseInt(id, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID karty.' }, { status: 400 });
    }

    const body = await request.json();
    const { price_pln, quantity, condition, foil } = body;

    const db = getDb();
    const stmt = db.prepare(`
      UPDATE cards
      SET price_pln = ?, quantity = ?, condition = ?, foil = ?
      WHERE id = ?
    `);

    stmt.run(
      parseFloat(price_pln) || 0,
      parseInt(quantity, 10) || 0,
      condition || 'NM',
      foil ? 1 : 0,
      cardId
    );

    return NextResponse.json({ success: true, message: 'Karta zaktualizowana.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const { id } = await params;
    const cardId = parseInt(id, 10);
    if (isNaN(cardId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID karty.' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM cards WHERE id = ?').run(cardId);

    return NextResponse.json({ success: true, message: 'Karta usunięta.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
