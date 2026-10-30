import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPin } from '@/lib/auth';
import {
  parseBuylistTextInput,
  parseBuylistCsvInput,
  convertParsedItemsToBuylistPreview,
  ConvertOptions,
  BuylistBulkPreviewItem,
} from '@/lib/buylist_bulk';

export async function POST(request: Request) {
  try {
    const pin = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pin)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawny PIN).' }, { status: 401 });
    }

    const body = await request.json();
    const {
      text = '',
      csvContent = '',
      action = 'preview',
      pricingMode = 'percent',
      percentRate = 75,
      fixedPrice = 10,
      eurRate,
      defaultMinCondition = 'LP',
      defaultFoil = 2,
      defaultNotes = '',
      cards, // optional confirmed items array for direct import
    } = body;

    const db = getDb();
    const rateRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('eur_to_pln') as { value: string } | undefined;
    const finalEurRate = eurRate ? parseFloat(eurRate) : parseFloat(rateRow?.value || '4.30') || 4.30;

    // Direct import of pre-verified/edited cards from preview
    if (action === 'import' && Array.isArray(cards) && cards.length > 0) {
      db.exec('BEGIN TRANSACTION;');
      try {
        const insertStmt = db.prepare(`
          INSERT INTO buylist_cards (
            name, set_code, set_name, collector_number, scryfall_id,
            image_url, mana_cost, colors, type_line, rarity,
            min_condition, foil, language, price_pln, quantity, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const c of cards as BuylistBulkPreviewItem[]) {
          insertStmt.run(
            c.name.trim(),
            c.set_code ? c.set_code.trim().toLowerCase() : null,
            c.set_name || null,
            c.collector_number || null,
            c.scryfall_id || null,
            c.image_url || null,
            c.mana_cost || '',
            c.colors || '[]',
            c.type_line || 'Magic: The Gathering',
            c.rarity || 'common',
            c.min_condition || 'LP',
            c.foil !== undefined ? c.foil : 2,
            c.language || 'en',
            parseFloat(String(c.price_pln)) || 0,
            parseInt(String(c.quantity), 10) || 1,
            c.notes || null
          );
        }

        db.exec('COMMIT;');
        return NextResponse.json({
          success: true,
          count: cards.length,
          message: `Pomyślnie dodano ${cards.length} kart do listy skupu!`,
        });
      } catch (txnErr) {
        db.exec('ROLLBACK;');
        throw txnErr;
      }
    }

    // Otherwise, parse the text or CSV content
    const parsedItems = csvContent.trim()
      ? parseBuylistCsvInput(csvContent)
      : parseBuylistTextInput(text);

    if (parsedItems.length === 0) {
      return NextResponse.json(
        { error: 'Nie znaleziono żadnych kart w podanym tekście ani pliku CSV. Wpisz listę np. "4x Orcish Bowmasters" lub wgraj plik.' },
        { status: 400 }
      );
    }

    const options: ConvertOptions = {
      pricingMode,
      percentRate: parseFloat(String(percentRate)) || 75,
      fixedPrice: parseFloat(String(fixedPrice)) || 10,
      eurRate: finalEurRate,
      defaultMinCondition,
      defaultFoil: parseInt(String(defaultFoil), 10) ?? 2,
      defaultNotes,
    };

    const previewCards = await convertParsedItemsToBuylistPreview(parsedItems, options);

    if (action === 'preview') {
      return NextResponse.json({
        success: true,
        count: previewCards.length,
        cards: previewCards,
      });
    }

    // Action === 'import' without pre-verified list
    db.exec('BEGIN TRANSACTION;');
    try {
      const insertStmt = db.prepare(`
        INSERT INTO buylist_cards (
          name, set_code, set_name, collector_number, scryfall_id,
          image_url, mana_cost, colors, type_line, rarity,
          min_condition, foil, language, price_pln, quantity, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const c of previewCards) {
        insertStmt.run(
          c.name.trim(),
          c.set_code ? c.set_code.trim().toLowerCase() : null,
          c.set_name || null,
          c.collector_number || null,
          c.scryfall_id || null,
          c.image_url || null,
          c.mana_cost || '',
          c.colors || '[]',
          c.type_line || 'Magic: The Gathering',
          c.rarity || 'common',
          c.min_condition || 'LP',
          c.foil !== undefined ? c.foil : 2,
          c.language || 'en',
          c.price_pln || 0,
          c.quantity || 1,
          c.notes || null
        );
      }

      db.exec('COMMIT;');
      return NextResponse.json({
        success: true,
        count: previewCards.length,
        message: `Pomyślnie dodano ${previewCards.length} kart do listy skupu!`,
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
