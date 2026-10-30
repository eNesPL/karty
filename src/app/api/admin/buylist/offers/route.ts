import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPin } from '@/lib/auth';
import { BuylistOffer, BuylistOfferItem } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const db = getDb();
    const offers = db
      .prepare('SELECT * FROM buylist_offers ORDER BY id DESC')
      .all() as unknown as BuylistOffer[];

    const getItemsStmt = db.prepare('SELECT * FROM buylist_offer_items WHERE offer_id = ?');

    for (const offer of offers) {
      offer.items = getItemsStmt.all(offer.id) as unknown as BuylistOfferItem[];
    }

    return NextResponse.json({ offers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
