import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BuylistCard } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const color = searchParams.get('color') || '';
    const foil = searchParams.get('foil');

    let sql = 'SELECT * FROM buylist_cards WHERE quantity > 0';
    const params: any[] = [];

    if (query) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(set_name) LIKE ? OR LOWER(type_line) LIKE ?)';
      const term = `%${query}%`;
      params.push(term, term, term);
    }

    if (color) {
      if (color === 'C') {
        sql += " AND (colors = '[]' OR colors = '')";
      } else if (color === 'M') {
        sql += " AND colors LIKE '%,%'";
      } else {
        sql += ' AND colors LIKE ?';
        params.push(`%"${color}"%`);
      }
    }

    if (foil === 'true') {
      sql += ' AND (foil = 1 OR foil = 2)';
    }

    sql += ' ORDER BY price_pln DESC, name ASC';

    const stmt = db.prepare(sql);
    const cards = stmt.all(...params) as unknown as BuylistCard[];

    return NextResponse.json({ cards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
