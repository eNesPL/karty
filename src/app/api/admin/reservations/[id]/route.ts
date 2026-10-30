import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';
import { Reservation, ReservationItem } from '@/lib/types';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const { id } = await params;
    const reservationId = parseInt(id, 10);
    if (isNaN(reservationId)) {
      return NextResponse.json({ error: 'Nieprawidłowe ID rezerwacji.' }, { status: 400 });
    }

    const body = await request.json();
    const { status } = body;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Nieprawidłowy status (dozwolone: pending, completed, cancelled).' }, { status: 400 });
    }

    const db = getDb();
    const currentRes = db.prepare('SELECT * FROM reservations WHERE id = ?').get(reservationId) as unknown as Reservation | undefined;

    if (!currentRes) {
      return NextResponse.json({ error: 'Rezerwacja nie istnieje.' }, { status: 404 });
    }

    const previousStatus = currentRes.status;

    db.exec('BEGIN TRANSACTION;');

    try {
      // If we are cancelling a reservation that was NOT cancelled, return items to inventory
      if (status === 'cancelled' && previousStatus !== 'cancelled') {
        const items = db
          .prepare('SELECT * FROM reservation_items WHERE reservation_id = ?')
          .all(reservationId) as unknown as ReservationItem[];

        const returnCardStmt = db.prepare('UPDATE cards SET quantity = quantity + ? WHERE id = ?');
        for (const item of items) {
          returnCardStmt.run(item.quantity, item.card_id);
        }
      }

      // If we are un-cancelling a reservation, re-decrement stock
      if (previousStatus === 'cancelled' && status !== 'cancelled') {
        const items = db
          .prepare('SELECT * FROM reservation_items WHERE reservation_id = ?')
          .all(reservationId) as unknown as ReservationItem[];

        const decrementCardStmt = db.prepare('UPDATE cards SET quantity = quantity - ? WHERE id = ?');
        for (const item of items) {
          decrementCardStmt.run(item.quantity, item.card_id);
        }
      }

      db.prepare('UPDATE reservations SET status = ? WHERE id = ?').run(status, reservationId);
      db.exec('COMMIT;');

      return NextResponse.json({ success: true, message: `Status zmieniony na ${status}` });
    } catch (txnErr) {
      db.exec('ROLLBACK;');
      throw txnErr;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
