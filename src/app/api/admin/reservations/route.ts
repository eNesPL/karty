import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPin } from '@/lib/auth';
import { Reservation, ReservationItem } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const db = getDb();
    const reservations = db
      .prepare('SELECT * FROM reservations ORDER BY id DESC')
      .all() as unknown as Reservation[];

    const getItemsStmt = db.prepare('SELECT * FROM reservation_items WHERE reservation_id = ?');

    for (const res of reservations) {
      res.items = getItemsStmt.all(res.id) as unknown as ReservationItem[];
    }

    return NextResponse.json({ reservations });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
