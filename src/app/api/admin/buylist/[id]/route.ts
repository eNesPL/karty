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
    const { price_pln, quantity, min_condition, foil, notes } = body;

    const db = getDb();
    const stmt = db.prepare(`
      UPDATE buylist_cards
      SET price_pln = ?, quantity = ?, min_condition = ?, foil = ?, notes = ?
      WHERE id = ?
    `);

    stmt.run(
      parseFloat(price_pln) || 0,
      parseInt(quantity, 10) || 0,
      min_condition || 'LP',
      parseInt(foil, 10) ?? 2,
      notes !== undefined ? notes : null,
      cardId
    );

    return NextResponse.json({ success: true, message: 'Karta w skupie zaktualizowana.' });
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
    db.prepare('DELETE FROM buylist_cards WHERE id = ?').run(cardId);

    return NextResponse.json({ success: true, message: 'Karta usunięta ze skupu.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
