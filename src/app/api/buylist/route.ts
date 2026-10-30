import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BuylistCard } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const color = searchParams.get('color') || '';
    const rarity = searchParams.get('rarity') || '';
    const cardType = searchParams.get('type') || searchParams.get('card_type') || '';
    const setCode = searchParams.get('set')?.trim().toLowerCase() || '';
    const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : null;
    const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : null;
    const foil = searchParams.get('foil');
    const sortBy = searchParams.get('sort') || 'price_desc';

    let sql = 'SELECT * FROM buylist_cards WHERE quantity > 0';
    const params: (string | number)[] = [];

    if (query) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(set_name) LIKE ? OR LOWER(type_line) LIKE ?)';
      const term = `%${query}%`;
      params.push(term, term, term);
    }

    if (color) {
      if (color === 'C') {
        sql += " AND (colors = '[]' OR colors = '' OR colors IS NULL)";
      } else if (color === 'M') {
        sql += " AND colors LIKE '%,%'";
      } else {
        const colorList = color.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
        for (const c of colorList) {
          sql += ' AND colors LIKE ?';
          params.push(`%"${c}"%`);
        }
      }
    }

    if (rarity) {
      sql += ' AND LOWER(rarity) = ?';
      params.push(rarity.toLowerCase());
    }

    if (cardType) {
      sql += ' AND LOWER(type_line) LIKE ?';
      params.push(`%${cardType.toLowerCase()}%`);
    }

    if (setCode) {
      sql += ' AND LOWER(set_code) = ?';
      params.push(setCode);
    }

    if (minPrice !== null && !isNaN(minPrice)) {
      sql += ' AND price_pln >= ?';
      params.push(minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      sql += ' AND price_pln <= ?';
      params.push(maxPrice);
    }

    if (foil === 'true') {
      sql += ' AND (foil = 1 OR foil = 2)';
    } else if (foil === 'false') {
      sql += ' AND (foil = 0 OR foil = 2)';
    }

    switch (sortBy) {
      case 'price_asc':
        sql += ' ORDER BY price_pln ASC, name ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price_pln DESC, name ASC';
        break;
      case 'name_asc':
      case 'name':
        sql += ' ORDER BY name ASC';
        break;
      case 'name_desc':
        sql += ' ORDER BY name DESC';
        break;
      case 'newest':
        sql += ' ORDER BY id DESC';
        break;
      case 'rarity_desc':
        sql += ` ORDER BY 
          CASE LOWER(rarity) 
            WHEN 'mythic' THEN 1 
            WHEN 'rare' THEN 2 
            WHEN 'uncommon' THEN 3 
            WHEN 'common' THEN 4 
            ELSE 5 
          END ASC, price_pln DESC`;
        break;
      default:
        sql += ' ORDER BY price_pln DESC, name ASC';
    }

    const stmt = db.prepare(sql);
    const cards = stmt.all(...params) as unknown as BuylistCard[];

    return NextResponse.json({ cards });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
