import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';
import { parseManaBoxCSV, convertManaBoxRowsToCards } from '@/lib/manabox';

export async function POST(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const body = await request.json();
    const {
      csvContent,
      action = 'import',
      priceMode = 'csv',
      fixedPrice = 10,
      eurRate,
      convertNmToLp = false,
    } = body;

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Brak zawartości pliku CSV.' }, { status: 400 });
    }

    const db = getDb();
    const rateRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('eur_to_pln') as { value: string } | undefined;
    const finalEurRate = eurRate ? parseFloat(eurRate) : parseFloat(rateRow?.value || '4.30') || 4.30;

    const rows = parseManaBoxCSV(csvContent);
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Nie udało się odczytać żadnych kart z pliku CSV. Upewnij się, że to poprawny eksport z ManaBox.' },
        { status: 400 }
      );
    }

    if (action === 'preview') {
      const sample = rows.slice(0, 5).map((r) => ({
        ...r,
        condition: convertNmToLp && (r.condition === 'NM' || r.condition === 'Near Mint') ? 'LP/EX' : r.condition,
      }));
      return NextResponse.json({
        success: true,
        total_rows: rows.length,
        sample,
      });
    }

    // Convert rows to full cards
    const cardsToInsert = await convertManaBoxRowsToCards(
      rows,
      finalEurRate,
      priceMode,
      fixedPrice,
      convertNmToLp
    );

    db.exec('BEGIN TRANSACTION;');
    try {
      const insertStmt = db.prepare(`
        INSERT INTO cards (
          name, set_code, set_name, collector_number, scryfall_id,
          image_url, mana_cost, colors, type_line, rarity,
          condition, foil, language, price_pln, price_eur, quantity
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const card of cardsToInsert) {
        insertStmt.run(
          card.name,
          card.set_code || null,
          card.set_name || null,
          card.collector_number || null,
          card.scryfall_id || null,
          card.image_url || null,
          card.mana_cost || '',
          card.colors || '[]',
          card.type_line || '',
          card.rarity || 'common',
          card.condition || 'NM',
          card.foil,
          card.language || 'en',
          card.price_pln,
          card.price_eur,
          card.quantity
        );
      }

      db.exec('COMMIT;');

      return NextResponse.json({
        success: true,
        message: `Pomyślnie zaimportowano ${cardsToInsert.length} kart z ManaBoxa!`,
        count: cardsToInsert.length,
      });
    } catch (txnErr) {
      db.exec('ROLLBACK;');
      throw txnErr;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
