import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';
import { BuylistCard } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase() || '';

    let sql = 'SELECT * FROM buylist_cards';
    const params: string[] = [];

    if (q) {
      sql += ' WHERE LOWER(name) LIKE ? OR LOWER(set_name) LIKE ? OR LOWER(set_code) LIKE ?';
      const term = `%${q}%`;
      params.push(term, term, term);
    }

    sql += ' ORDER BY id DESC';

    const cards = db.prepare(sql).all(...params) as unknown as BuylistCard[];
    return NextResponse.json({ cards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      set_code,
      set_name,
      collector_number,
      scryfall_id,
      image_url,
      mana_cost,
      colors,
      type_line,
      rarity,
      min_condition = 'LP',
      foil = 2,
      language = 'en',
      price_pln,
      quantity = 1,
      notes = '',
    } = body;

    if (!name || price_pln === undefined) {
      return NextResponse.json({ error: 'Nazwa karty i oferowana cena skupu w PLN są wymagane.' }, { status: 400 });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO buylist_cards (
        name, set_code, set_name, collector_number, scryfall_id,
        image_url, mana_cost, colors, type_line, rarity,
        min_condition, foil, language, price_pln, quantity, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      set_code ? set_code.trim().toLowerCase() : null,
      set_name ? set_name.trim() : null,
      collector_number ? collector_number.trim() : null,
      scryfall_id ? scryfall_id.trim() : null,
      image_url ? image_url.trim() : null,
      mana_cost || '',
      typeof colors === 'string' ? colors : JSON.stringify(colors || []),
      type_line || '',
      rarity || 'common',
      min_condition || 'LP',
      parseInt(foil, 10) ?? 2,
      language || 'en',
      parseFloat(price_pln) || 0,
      parseInt(quantity, 10) || 1,
      notes ? notes.trim() : null
    );

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
