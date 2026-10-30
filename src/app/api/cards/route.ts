import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Card, CardFiltersMeta, FilterMetaSet } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q')?.trim().toLowerCase() || '';
    const color = searchParams.get('color') || '';
    const rarity = searchParams.get('rarity') || '';
    const cardType = searchParams.get('type') || searchParams.get('card_type') || '';
    const setCode = searchParams.get('set')?.trim().toLowerCase() || '';
    const condition = searchParams.get('condition')?.trim() || '';
    const minPrice = searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : null;
    const maxPrice = searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : null;
    const foil = searchParams.get('foil');
    const inStock = searchParams.get('in_stock');
    const sortBy = searchParams.get('sort') || 'price_desc';

    let sql = 'SELECT * FROM cards WHERE 1=1';
    const params: any[] = [];

    // Stock availability: default to in_stock unless explicitly set to 'false' or 'all'
    if (inStock !== 'false' && inStock !== 'all') {
      sql += ' AND quantity > 0';
    }

    // Search query
    if (query) {
      sql += ' AND (LOWER(name) LIKE ? OR LOWER(set_name) LIKE ? OR LOWER(set_code) LIKE ? OR LOWER(type_line) LIKE ?)';
      const term = `%${query}%`;
      params.push(term, term, term, term);
    }

    // Color filter
    if (color) {
      if (color === 'C') {
        // Colorless
        sql += " AND (colors = '[]' OR colors = '' OR colors IS NULL)";
      } else if (color === 'M') {
        // Multicolor (has comma in JSON array)
        sql += " AND colors LIKE '%,%'";
      } else {
        const colorList = color.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean);
        for (const c of colorList) {
          sql += ' AND colors LIKE ?';
          params.push(`%"${c}"%`);
        }
      }
    }

    // Rarity filter (supports multiple comma-separated)
    if (rarity) {
      const rarities = rarity.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
      if (rarities.length === 1) {
        sql += ' AND LOWER(rarity) = ?';
        params.push(rarities[0]);
      } else if (rarities.length > 1) {
        const placeholders = rarities.map(() => '?').join(',');
        sql += ` AND LOWER(rarity) IN (${placeholders})`;
        params.push(...rarities);
      }
    }

    // Card Type filter
    if (cardType) {
      sql += ' AND LOWER(type_line) LIKE ?';
      params.push(`%${cardType.toLowerCase()}%`);
    }

    // Set filter
    if (setCode) {
      sql += ' AND LOWER(set_code) = ?';
      params.push(setCode);
    }

    // Condition filter
    if (condition) {
      sql += ' AND condition = ?';
      params.push(condition);
    }

    // Price range
    if (minPrice !== null && !isNaN(minPrice)) {
      sql += ' AND price_pln >= ?';
      params.push(minPrice);
    }
    if (maxPrice !== null && !isNaN(maxPrice)) {
      sql += ' AND price_pln <= ?';
      params.push(maxPrice);
    }

    // Foil filter
    if (foil === 'true') {
      sql += ' AND foil = 1';
    } else if (foil === 'false') {
      sql += ' AND foil = 0';
    }

    // Sorting
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
    const cards = stmt.all(...params) as unknown as Card[];

    // Fetch meta information for dynamic filter options
    const sets = db.prepare(`
      SELECT set_code, set_name, count(*) as count 
      FROM cards 
      WHERE set_code IS NOT NULL AND set_code != '' 
      GROUP BY set_code, set_name 
      ORDER BY set_name ASC
    `).all() as unknown as FilterMetaSet[];

    const rarities = db.prepare(`
      SELECT rarity, count(*) as count 
      FROM cards 
      WHERE rarity IS NOT NULL AND rarity != '' 
      GROUP BY rarity
    `).all() as unknown as { rarity: string; count: number }[];

    const priceStats = db.prepare(`
      SELECT MIN(price_pln) as min_price, MAX(price_pln) as max_price, COUNT(*) as total 
      FROM cards
    `).get() as { min_price: number | null; max_price: number | null; total: number };

    const meta: CardFiltersMeta = {
      sets: sets || [],
      rarities: rarities || [],
      minPrice: priceStats?.min_price || 0,
      maxPrice: priceStats?.max_price || 0,
      totalCards: priceStats?.total || 0,
    };

    return NextResponse.json({
      cards,
      total: cards.length,
      meta,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
