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

    let imageUrl = data.image_uris?.normal || data.image_uris?.large || '';
    if (!imageUrl && data.card_faces && data.card_faces[0]?.image_uris) {
      imageUrl = data.card_faces[0].image_uris.normal;
    }
    if (!imageUrl) {
      imageUrl = getScryfallDirectImageUrl(scryfallId);
    }

    return {
      id: data.id,
      name: data.name,
      set: data.set,
      set_name: data.set_name,
      collector_number: data.collector_number,
      mana_cost: data.mana_cost,
      type_line: data.type_line,
      colors: data.colors || [],
      rarity: data.rarity,
      prices: {
        eur: data.prices?.eur,
        eur_foil: data.prices?.eur_foil,
        usd: data.prices?.usd,
      },
      image_url: imageUrl,
    };
  } catch (err) {
    console.error('Error fetching Scryfall card:', err);
    return null;
  }
}

export async function searchScryfallCards(query: string): Promise<ScryfallCardData[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&order=name`, {
      headers: {
        'User-Agent': 'KartyMTG/1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) return [];
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return [];

    return json.data.slice(0, 10).map((card: any) => {
      let imageUrl = card.image_uris?.normal || card.image_uris?.large || '';
      if (!imageUrl && card.card_faces && card.card_faces[0]?.image_uris) {
        imageUrl = card.card_faces[0].image_uris.normal;
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
    });
  } catch (err) {
    console.error('Error searching Scryfall:', err);
    return [];
  }
}
