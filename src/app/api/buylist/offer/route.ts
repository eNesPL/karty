import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { BuylistCard, BuylistOffer, BuylistOfferItem } from '@/lib/types';
import { sendBuylistOfferDiscordNotification } from '@/lib/discord';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { seller_name, seller_contact, meeting_day, notes, items } = body;

    if (!seller_name || !seller_contact || !meeting_day) {
      return NextResponse.json(
        { error: 'Wypełnij wymagane pola: Twoje Imię/Nick, Kontakt oraz Dzień spotkania.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Nie wybrano żadnych kart do zaoferowania.' }, { status: 400 });
    }

    const db = getDb();

    // Verify all cards exist in buylist
    const cardStmt = db.prepare('SELECT * FROM buylist_cards WHERE id = ?');
    const checkedItems: Array<{ buylistCard: BuylistCard; requestedQty: number; condition: string; foil: number }> = [];
    let totalPayout = 0;

    for (const item of items) {
      const buylistCard = cardStmt.get(item.buylist_card_id) as unknown as BuylistCard | undefined;
      if (!buylistCard) {
        return NextResponse.json(
          { error: `Karta poszukiwana o ID ${item.buylist_card_id} nie istnieje na liście skupu.` },
          { status: 400 }
        );
      }

      const qty = parseInt(item.quantity, 10) || 1;
      if (qty <= 0) {
        return NextResponse.json({ error: 'Nieprawidłowa ilość karty.' }, { status: 400 });
      }

      const condition = item.condition || buylistCard.min_condition || 'NM';
      const foil = item.foil !== undefined ? (item.foil ? 1 : 0) : (buylistCard.foil === 1 ? 1 : 0);

      totalPayout += buylistCard.price_pln * qty;
      checkedItems.push({ buylistCard, requestedQty: qty, condition, foil });
    }

    // Begin transaction
    db.exec('BEGIN TRANSACTION;');

    try {
      const insertOfferStmt = db.prepare(`
        INSERT INTO buylist_offers (seller_name, seller_contact, meeting_day, notes, status, total_payout_pln)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `);

      const offerResult = insertOfferStmt.run(
        seller_name.trim(),
        seller_contact.trim(),
        meeting_day.trim(),
        notes ? notes.trim() : '',
        totalPayout
      );

      const offerId = Number(offerResult.lastInsertRowid);

      const insertItemStmt = db.prepare(`
        INSERT INTO buylist_offer_items (
          offer_id, buylist_card_id, quantity, offered_price_pln, card_name,
          set_code, collector_number, image_url, foil, condition
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const savedItems: BuylistOfferItem[] = [];

      for (const { buylistCard, requestedQty, condition, foil } of checkedItems) {
        insertItemStmt.run(
          offerId,
          buylistCard.id,
          requestedQty,
          buylistCard.price_pln,
          buylistCard.name,
          buylistCard.set_code || null,
          buylistCard.collector_number || null,
          buylistCard.image_url || null,
          foil,
          condition
        );

        savedItems.push({
          offer_id: offerId,
          buylist_card_id: buylistCard.id,
          quantity: requestedQty,
          offered_price_pln: buylistCard.price_pln,
          card_name: buylistCard.name,
          set_code: buylistCard.set_code,
          collector_number: buylistCard.collector_number,
          image_url: buylistCard.image_url,
          foil,
          condition,
        });
      }

      db.exec('COMMIT;');

      // Trigger Discord notification asynchronously
      const webhookRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('discord_webhook') as { value: string } | undefined;
      const webhookUrl = webhookRow?.value;

      if (webhookUrl) {
        const fullOffer: BuylistOffer = {
          id: offerId,
          seller_name: seller_name.trim(),
          seller_contact: seller_contact.trim(),
          meeting_day: meeting_day.trim(),
          notes: notes ? notes.trim() : null,
          status: 'pending',
          total_payout_pln: totalPayout,
          created_at: new Date().toISOString(),
          items: savedItems,
        };

        sendBuylistOfferDiscordNotification(webhookUrl, fullOffer, savedItems).catch((err) => {
          console.error('Error sending Discord notification for buylist offer:', err);
        });
      }

      return NextResponse.json({
        success: true,
        offer_id: offerId,
        total_payout_pln: totalPayout,
        message: 'Oferta sprzedaży została wysłana! Właściciel skontaktuje się z Tobą lub spotkacie się na turnieju.',
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
