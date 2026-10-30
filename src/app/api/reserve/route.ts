import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Card, Reservation, ReservationItem } from '@/lib/types';
import { sendDiscordNotification } from '@/lib/discord';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyer_name, buyer_contact, pickup_day, notes, items } = body;

    if (!buyer_name || !buyer_contact || !pickup_day) {
      return NextResponse.json(
        { error: 'Wypełnij wymagane pola: Imię/Nick, Kontakt oraz Dzień odbioru.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Koszyk jest pusty.' }, { status: 400 });
    }

    const db = getDb();

    // Verify all cards and quantities
    const cardStmt = db.prepare('SELECT * FROM cards WHERE id = ?');
    const checkedItems: Array<{ card: Card; requestedQty: number }> = [];
    let totalPrice = 0;

    for (const item of items) {
      const card = cardStmt.get(item.card_id) as unknown as Card | undefined;
      if (!card) {
        return NextResponse.json(
          { error: `Karta o ID ${item.card_id} nie istnieje w bazie.` },
          { status: 400 }
        );
      }

      const qty = parseInt(item.quantity, 10) || 1;
      if (qty <= 0) {
        return NextResponse.json({ error: 'Nieprawidłowa ilość karty.' }, { status: 400 });
      }

      if (card.quantity < qty) {
        return NextResponse.json(
          {
            error: `Niestety karta "${card.name}" nie jest już dostępna w wybranej ilości (pozostało: ${card.quantity} szt.).`,
          },
          { status: 400 }
        );
      }

      totalPrice += card.price_pln * qty;
      checkedItems.push({ card, requestedQty: qty });
    }

    // Execute transaction: insert reservation, decrement cards, insert items
    db.exec('BEGIN TRANSACTION;');

    try {
      const insertResStmt = db.prepare(`
        INSERT INTO reservations (buyer_name, buyer_contact, pickup_day, notes, status, total_price_pln)
        VALUES (?, ?, ?, ?, 'pending', ?)
      `);
      const resResult = insertResStmt.run(
        buyer_name.trim(),
        buyer_contact.trim(),
        pickup_day.trim(),
        notes ? notes.trim() : '',
        totalPrice
      );

      const reservationId = Number(resResult.lastInsertRowid);

      const updateCardStmt = db.prepare('UPDATE cards SET quantity = quantity - ? WHERE id = ?');
      const insertItemStmt = db.prepare(`
        INSERT INTO reservation_items (
          reservation_id, card_id, quantity, price_pln, card_name,
          set_code, collector_number, image_url, foil, condition
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const savedItems: ReservationItem[] = [];

      for (const { card, requestedQty } of checkedItems) {
        updateCardStmt.run(requestedQty, card.id);
        insertItemStmt.run(
          reservationId,
          card.id,
          requestedQty,
          card.price_pln,
          card.name,
          card.set_code || null,
          card.collector_number || null,
          card.image_url || null,
          card.foil,
          card.condition
        );

        savedItems.push({
          card_id: card.id,
          quantity: requestedQty,
          price_pln: card.price_pln,
          card_name: card.name,
          set_code: card.set_code,
          collector_number: card.collector_number,
          image_url: card.image_url,
          foil: card.foil,
          condition: card.condition,
        });
      }

      db.exec('COMMIT;');

      // Send Discord notification asynchronously
      const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
      const webhookRow = getSettingStmt.get('discord_webhook') as { value: string } | undefined;
      const webhookUrl = webhookRow?.value;

      if (webhookUrl) {
        const fullReservation: Reservation = {
          id: reservationId,
          buyer_name: buyer_name.trim(),
          buyer_contact: buyer_contact.trim(),
          pickup_day: pickup_day.trim(),
          notes: notes ? notes.trim() : null,
          status: 'pending',
          total_price_pln: totalPrice,
          created_at: new Date().toISOString(),
        };

        sendDiscordNotification(webhookUrl, fullReservation, savedItems).catch((err) => {
          console.error('Error sending Discord notification:', err);
        });
      }

      return NextResponse.json({
        success: true,
        reservation_id: reservationId,
        total_price_pln: totalPrice,
      });
    } catch (txnError) {
      db.exec('ROLLBACK;');
      throw txnError;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Reservation error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
