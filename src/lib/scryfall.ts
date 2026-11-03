export interface ScryfallCardData {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  mana_cost?: string;
  type_line?: string;
  colors?: string[];
  rarity?: string;
  prices: {
    eur?: string | null;
    eur_foil?: string | null;
    usd?: string | null;
  };
  image_url: string;
}

export function getScryfallDirectImageUrl(scryfallId: string): string {
  if (!scryfallId || scryfallId.length < 2) return '';
  return `https://cards.scryfall.io/normal/front/${scryfallId[0]}/${scryfallId[1]}/${scryfallId}.jpg`;
}

function mapScryfallCard(card: any): ScryfallCardData {
  let imageUrl = card.image_uris?.normal || card.image_uris?.large || '';
  if (!imageUrl && card.card_faces?.[0]?.image_uris) {
    imageUrl = card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.large || '';
  }
  if (!imageUrl) {
    imageUrl = getScryfallDirectImageUrl(card.id);
  }

  return {
    id: card.id,
    name: card.name,
    set: card.set,
    set_name: card.set_name,
    collector_number: card.collector_number,
    mana_cost: card.mana_cost,
    type_line: card.type_line,
    colors: card.colors || [],
    rarity: card.rarity,
    prices: {
      eur: card.prices?.eur,
      eur_foil: card.prices?.eur_foil,
      usd: card.prices?.usd,
    },
    image_url: imageUrl,
  };
}

export async function fetchScryfallCardById(scryfallId: string): Promise<ScryfallCardData | null> {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/${scryfallId}`, {
      headers: {
        'User-Agent': 'KartyMTG/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return mapScryfallCard(data);
  } catch (err) {
    console.error('Error fetching Scryfall card:', err);
    return null;
  }
}

/**
 * Searches every matching Scryfall printing, not just one representative card.
 * Scryfall paginates search results, so follow next_page until has_more is false.
 */
export async function searchScryfallCards(query: string): Promise<ScryfallCardData[]> {
  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) return [];

  const headers = {
    'User-Agent': 'KartyMTG/1.0',
    Accept: 'application/json',
  };

  const results: ScryfallCardData[] = [];
  const seenIds = new Set<string>();
  let nextUrl: string | null =
    `https://api.scryfall.com/cards/search?q=${encodeURIComponent(trimmedQuery)}&unique=prints&order=released&dir=desc`;

  try {
    while (nextUrl) {
      const res: Response = await fetch(nextUrl, { headers });
      if (!res.ok) {
        if (res.status === 404 && results.length === 0) return [];
        throw new Error(`Scryfall search failed: HTTP ${res.status}`);
      }

      const page = await res.json();
      if (!Array.isArray(page.data)) break;

      for (const card of page.data) {
        if (card?.id && !seenIds.has(card.id)) {
          seenIds.add(card.id);
          results.push(mapScryfallCard(card));
        }
      }

      nextUrl = page.has_more && typeof page.next_page === 'string'
        ? page.next_page
        : null;

      // Scryfall asks API clients to keep requests spaced out.
      if (nextUrl) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return results;
  } catch (err) {
    console.error('Error searching Scryfall printings:', err);
    return results;
  }
}
