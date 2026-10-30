import { Reservation, ReservationItem, BuylistOffer, BuylistOfferItem } from './types';

export async function sendDiscordNotification(
  webhookUrl: string,
  reservation: Reservation,
  items: ReservationItem[]
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    console.warn('Discord webhook not configured or invalid URL.');
    return false;
  }

  try {
    const cardList = items
      .map((item) => {
        const foilTag = item.foil ? '✨ *Foil*' : '';
        const setTag = item.set_code ? `(${item.set_code.toUpperCase()} #${item.collector_number || '?'})` : '';
        return `• **${item.quantity}x** ${item.card_name} ${setTag} [${item.condition}] ${foilTag} — **${(item.price_pln * item.quantity).toFixed(2)} PLN**`;
      })
      .join('\n');

    const totalCardsCount = items.reduce((acc, cur) => acc + cur.quantity, 0);
    const firstImageUrl = items.find((i) => i.image_url)?.image_url;

    const payload = {
      username: 'MTG Klaser Bot',
      avatar_url: 'https://cards.scryfall.io/back.png',
      embeds: [
        {
          title: '🃏 Nowa rezerwacja kart MTG!',
          color: 0x10b981, // Emerald green
          description: `Złożono nowe zamówienie do odbioru stacjonarnego.`,
          fields: [
            {
              name: '👤 Kupujący',
              value: reservation.buyer_name || 'Nieznany',
              inline: true,
            },
            {
              name: '📱 Kontakt',
              value: reservation.buyer_contact || 'Brak',
              inline: true,
            },
            {
              name: '📅 Termin odbioru',
              value: `**${reservation.pickup_day}**`,
              inline: true,
            },
            {
              name: `🗂️ Karty (${totalCardsCount} szt.)`,
              value: cardList.length > 1024 ? cardList.slice(0, 1000) + '...' : cardList,
              inline: false,
            },
            {
              name: '💰 Łączna kwota',
              value: `### ${reservation.total_price_pln.toFixed(2)} PLN`,
              inline: true,
            },
            {
              name: '📝 Uwagi',
              value: reservation.notes ? reservation.notes : '_Brak dodatkowych uwag_',
              inline: true,
            },
          ],
          thumbnail: firstImageUrl ? { url: firstImageUrl } : undefined,
          footer: {
            text: `ID Rezerwacji: #${reservation.id} • Karty MTG`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Discord webhook error:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to send Discord webhook:', err);
    return false;
  }
}

export async function sendBuylistOfferDiscordNotification(
  webhookUrl: string,
  offer: BuylistOffer,
  items: BuylistOfferItem[]
): Promise<boolean> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    console.warn('Discord webhook not configured or invalid URL.');
    return false;
  }

  try {
    const cardList = items
      .map((item) => {
        const foilTag = item.foil ? '✨ *Foil*' : '';
        const setTag = item.set_code ? `(${item.set_code.toUpperCase()} #${item.collector_number || '?'})` : '';
        return `• **${item.quantity}x** ${item.card_name} ${setTag} [${item.condition}] ${foilTag} — **${(item.offered_price_pln * item.quantity).toFixed(2)} PLN**`;
      })
      .join('\n');

    const totalCardsCount = items.reduce((acc, cur) => acc + cur.quantity, 0);
    const firstImageUrl = items.find((i) => i.image_url)?.image_url;

    const payload = {
      username: 'MTG Skup & Klaser Bot',
      avatar_url: 'https://cards.scryfall.io/back.png',
      embeds: [
        {
          title: '📥 Nowa oferta sprzedaży kart od gracza (Skup)!',
          color: 0x3b82f6, // Blue
          description: `Gracz chce sprzedać Ci karty z Twojej listy poszukiwanych!`,
          fields: [
            {
              name: '👤 Sprzedający',
              value: offer.seller_name || 'Nieznany',
              inline: true,
            },
            {
              name: '📱 Kontakt',
              value: offer.seller_contact || 'Brak',
              inline: true,
            },
            {
              name: '📅 Dzień spotkania',
              value: `**${offer.meeting_day}**`,
              inline: true,
            },
            {
              name: `🗂️ Oferowane karty (${totalCardsCount} szt.)`,
              value: cardList.length > 1024 ? cardList.slice(0, 1000) + '...' : cardList,
              inline: false,
            },
            {
              name: '💵 Łączna kwota do wypłaty',
              value: `### ${offer.total_payout_pln.toFixed(2)} PLN`,
              inline: true,
            },
            {
              name: '📝 Uwagi od gracza',
              value: offer.notes ? offer.notes : '_Brak dodatkowych uwag_',
              inline: true,
            },
          ],
          thumbnail: firstImageUrl ? { url: firstImageUrl } : undefined,
          footer: {
            text: `ID Oferty: #${offer.id} • MTG Skup`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Discord webhook error:', res.status, errText);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to send Discord webhook for buylist offer:', err);
    return false;
  }
}

export async function testDiscordWebhook(webhookUrl: string): Promise<{ success: boolean; message: string }> {
  if (!webhookUrl || !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    return { success: false, message: 'Niepoprawny format adresu Discord Webhook.' };
  }

  try {
    const payload = {
      username: 'MTG Klaser Bot',
      embeds: [
        {
          title: '✅ Test powiadomień Discord',
          color: 0x6366f1, // Indigo
          description: 'Gratulacje! Twój webhook działa poprawnie. Otrzymasz tutaj powiadomienie za każdym razem, gdy ktoś zarezerwuje kartę z Twojego klasera.',
          fields: [
            {
              name: 'Status',
              value: 'Połączono pomyślnie!',
              inline: true,
            },
          ],
          footer: {
            text: 'MTG Klaser Bot • System Rezerwacji',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, message: `Błąd Discord HTTP ${res.status}: ${await res.text()}` };
    }

    return { success: true, message: 'Testowy webhook wysłany pomyślnie na Discord!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Błąd połączenia: ${msg}` };
  }
}
