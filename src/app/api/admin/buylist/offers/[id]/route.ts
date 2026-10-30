import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPin } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const { id } = await params;
    const offerId = parseInt(id, 10);
    if (isNaN(offerId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID oferty.' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['pending', 'accepted', 'completed', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Nieprawidłowy status oferty.' }, { status: 400 });
    }

    const db = getDb();
    const stmt = db.prepare('UPDATE buylist_offers SET status = ? WHERE id = ?');
    stmt.run(status, offerId);

    return NextResponse.json({ success: true, message: `Status oferty zmieniony na ${status}.` });
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
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const { id } = await params;
    const offerId = parseInt(id, 10);
    if (isNaN(offerId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID oferty.' }, { status: 400 });
    }

    const db = getDb();
    db.prepare('DELETE FROM buylist_offers WHERE id = ?').run(offerId);

    return NextResponse.json({ success: true, message: 'Oferta usunięta.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
