import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';
import { searchScryfallCards } from '@/lib/scryfall';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const { id } = await params;
    const cardId = Number.parseInt(id, 10);
    if (!Number.isInteger(cardId) || cardId < 1) {
      return NextResponse.json({ error: 'Nieprawidłowe ID karty.' }, { status: 400 });
    }

    const db = getDb();
    const card = db.prepare('SELECT * FROM buylist_cards WHERE id = ?').get(cardId) as {
      id: number;
      name: string;
      foil: number;
    } | undefined;

    if (!card) {
      return NextResponse.json({ error: 'Nie znaleziono karty na liście skupu.' }, { status: 404 });
    }

    const printings = await searchScryfallCards(`!"${card.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`);
    if (printings.length === 0) {
      return NextResponse.json({ error: 'Scryfall nie zwrócił żadnych printów tej karty.' }, { status: 404 });
    }

    const candidates = printings.flatMap((printing) => {
      const prices: Array<{ finish: 'nonfoil' | 'foil'; eur: number }> = [];
      const nonfoil = Number.parseFloat(printing.prices?.eur || '');
      const foil = Number.parseFloat(printing.prices?.eur_foil || '');

      if ((card.foil === 0 || card.foil === 2) && Number.isFinite(nonfoil) && nonfoil > 0) {
        prices.push({ finish: 'nonfoil', eur: nonfoil });
      }
      if ((card.foil === 1 || card.foil === 2) && Number.isFinite(foil) && foil > 0) {
        prices.push({ finish: 'foil', eur: foil });
      }

      return prices.map((price) => ({ printing, ...price }));
    }).sort((a, b) => a.eur - b.eur);

    if (candidates.length === 0) {
      return NextResponse.json({
        error: card.foil === 1
          ? 'Brak aktualnych cen foil dla printów tej karty w Scryfall.'
          : 'Brak aktualnych cen non-foil dla printów tej karty w Scryfall.',
      }, { status: 404 });
    }

    const cheapest = candidates[0];
    const rateRow = db.prepare("SELECT value FROM settings WHERE key = 'eur_to_pln'").get() as { value: string } | undefined;
    const eurRate = Number.parseFloat(rateRow?.value || '4.30');
    if (!Number.isFinite(eurRate) || eurRate <= 0) {
      return NextResponse.json({ error: 'Nieprawidłowy kurs EUR/PLN w ustawieniach.' }, { status: 500 });
    }

    // Buylist payout follows the default 75% market-value rate used by the bulk importer.
    const marketPricePln = cheapest.eur * eurRate;
    const pricePln = Math.max(1, Math.round(marketPricePln * 0.75 * 2) / 2);

    db.prepare(`
      UPDATE buylist_cards
      SET price_pln = ?, set_code = ?, set_name = ?, collector_number = ?,
          scryfall_id = ?, image_url = ?, mana_cost = ?, colors = ?,
          type_line = ?, rarity = ?
      WHERE id = ?
    `).run(
      pricePln,
      cheapest.printing.set,
      cheapest.printing.set_name,
      cheapest.printing.collector_number,
      cheapest.printing.id,
      cheapest.printing.image_url,
      cheapest.printing.mana_cost || '',
      JSON.stringify(cheapest.printing.colors || []),
      cheapest.printing.type_line || '',
      cheapest.printing.rarity || 'common',
      cardId
    );

    return NextResponse.json({
      success: true,
      price_pln: pricePln,
      market_price_eur: cheapest.eur,
      eur_to_pln: eurRate,
      payout_percent: 75,
      finish: cheapest.finish,
      printing: {
        set_code: cheapest.printing.set,
        set_name: cheapest.printing.set_name,
        collector_number: cheapest.printing.collector_number,
      },
      printings_checked: printings.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
