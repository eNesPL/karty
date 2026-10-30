import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPin } from '@/lib/auth';
import { Card } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim().toLowerCase() || '';
    const setCode = searchParams.get('set')?.trim().toLowerCase() || '';
    const rarity = searchParams.get('rarity')?.trim().toLowerCase() || '';
    const foil = searchParams.get('foil');
    const inStock = searchParams.get('in_stock');

    let sql = 'SELECT * FROM cards WHERE 1=1';
    const params: any[] = [];

    if (q) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(set_name) LIKE ? OR LOWER(set_code) LIKE ? OR LOWER(type_line) LIKE ?)';
      const term = `%${q}%`;
      params.push(term, term, term, term);
    }

    if (setCode) {
      sql += ' AND LOWER(set_code) = ?';
      params.push(setCode);
    }

    if (rarity) {
      sql += ' AND LOWER(rarity) = ?';
      params.push(rarity);
    }

    if (foil === 'true') {
      sql += ' AND foil = 1';
    } else if (foil === 'false') {
      sql += ' AND foil = 0';
    }

    if (inStock === 'true') {
      sql += ' AND quantity > 0';
    } else if (inStock === 'false') {
      sql += ' AND quantity = 0';
    }

    sql += ' ORDER BY id DESC';

    const cards = db.prepare(sql).all(...params) as unknown as Card[];
    return NextResponse.json({ cards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
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
      condition,
      foil,
      language,
      price_pln,
      price_eur,
      quantity,
    } = body;

    if (!name || price_pln === undefined) {
      return NextResponse.json({ error: 'Nazwa karty i cena w PLN są wymagane.' }, { status: 400 });
    }

    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO cards (
        name, set_code, set_name, collector_number, scryfall_id,
        image_url, mana_cost, colors, type_line, rarity,
        condition, foil, language, price_pln, price_eur, quantity
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
      condition || 'NM',
      foil ? 1 : 0,
      language || 'en',
      parseFloat(price_pln) || 0,
      price_eur ? parseFloat(price_eur) : null,
      parseInt(quantity, 10) || 1
    );

    return NextResponse.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const body = await request.json();
    const { fromCondition = 'NM', toCondition = 'LP/EX' } = body;

    if (!toCondition) {
      return NextResponse.json({ error: 'Docelowy stan jest wymagany.' }, { status: 400 });
    }

    const db = getDb();
    let result;

    if (fromCondition === 'ALL' || fromCondition === '*') {
      result = db.prepare('UPDATE cards SET condition = ?').run(toCondition);
    } else if (fromCondition.toUpperCase() === 'NM' || fromCondition.toLowerCase() === 'near mint') {
      result = db.prepare(`
        UPDATE cards
        SET condition = ?
        WHERE condition IN ('NM', 'Near Mint', 'Near mint', 'nm')
      `).run(toCondition);
    } else {
      result = db.prepare(`
        UPDATE cards
        SET condition = ?
        WHERE condition = ?
      `).run(toCondition, fromCondition);
    }

    const updatedCount = Number(result.changes);

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Pomyślnie zaktualizowano stan ${updatedCount} kart na ${toCondition}.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
