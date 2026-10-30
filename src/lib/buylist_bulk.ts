import Papa from 'papaparse';
import { getScryfallDirectImageUrl } from './scryfall';

export interface ParsedBuylistItem {
  name: string;
  quantity: number;
  set?: string;
  collector_number?: string;
  isFoil?: boolean;
  csvPrice?: number;
}

export interface BuylistBulkPreviewItem {
  name: string;
  set_code: string | null;
  set_name: string | null;
  collector_number: string | null;
  scryfall_id: string | null;
  image_url: string | null;
  mana_cost: string | null;
  colors: string;
  type_line: string | null;
  rarity: string | null;
  min_condition: string;
  foil: number; // 0, 1, 2
  language: string;
  price_pln: number;
  quantity: number;
  notes: string | null;
  market_eur?: number | null;
}

export function parseBuylistTextInput(text: string): ParsedBuylistItem[] {
  const lines = text.split(/\r?\n/);
  const items: ParsedBuylistItem[] = [];

  for (let rawLine of lines) {
    rawLine = rawLine.trim();
    if (!rawLine || rawLine.startsWith('#') || rawLine.startsWith('//')) continue;

    let qty = 1;
    let remaining = rawLine;

    // 1. Match leading quantity: '4x ', '4 ', '1x'
    const qtyMatch = remaining.match(/^(\d+)\s*x?\s+/i);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1], 10) || 1;
      remaining = remaining.slice(qtyMatch[0].length).trim();
    }

    // 2. Foil flag: *F*, *f*, foil
    let isFoil = false;
    if (/(\*F\*|\*f\*|\bfoil\b)/i.test(remaining)) {
      isFoil = true;
      remaining = remaining.replace(/(\*F\*|\*f\*|\bfoil\b)/gi, '').trim();
    }

    let setCode: string | undefined;
    let collectorNumber: string | undefined;

    // 3. Match set and collector number: (SET) 123, [SET] #123, (SET:123)
    const setWithNumMatch = remaining.match(/[\(\[](?:set:)?([a-zA-Z0-9]{3,5})(?:[:\s]+#?([a-zA-Z0-9]+))?[\)\]](?:\s*#?([a-zA-Z0-9]+))?/i);
    if (setWithNumMatch) {
      setCode = setWithNumMatch[1].toLowerCase();
      collectorNumber = setWithNumMatch[2] || setWithNumMatch[3];
      remaining = remaining.replace(setWithNumMatch[0], '').trim();
    }

    const name = remaining.replace(/\s+/g, ' ').trim();
    if (name) {
      items.push({
        name,
        quantity: qty,
        set: setCode,
        collector_number: collectorNumber,
        isFoil,
      });
    }
  }

  return items;
}

export function parseBuylistCsvInput(csvContent: string): ParsedBuylistItem[] {
  const result = Papa.parse<Record<string, string>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const items: ParsedBuylistItem[] = [];

  for (const raw of result.data) {
    const getVal = (possibleKeys: string[]): string => {
      for (const key of Object.keys(raw)) {
        const lowerKey = key.trim().toLowerCase();
        for (const pk of possibleKeys) {
          if (lowerKey === pk.toLowerCase()) {
            return (raw[key] || '').trim();
          }
        }
      }
      return '';
    };

    const name = getVal(['name', 'card name', 'card_name']);
    if (!name) continue;

    const set_code = getVal(['set code', 'set_code', 'expansion code']).toLowerCase();
    const collector_number = getVal(['collector number', 'collector_number', 'card number', 'number']);
    const foilRaw = getVal(['foil', 'is_foil', 'finish']).toLowerCase();
    const isFoil = foilRaw === 'true' || foilRaw === 'foil' || foilRaw === 'etched';

    const quantityRaw = parseInt(getVal(['quantity', 'count', 'qty']), 10);
    const quantity = isNaN(quantityRaw) || quantityRaw < 1 ? 1 : quantityRaw;

    const priceRaw = parseFloat(getVal(['purchase price', 'price', 'purchase_price', 'buylist_price']).replace(',', '.'));
    const csvPrice = isNaN(priceRaw) ? undefined : priceRaw;

    items.push({
      name,
      quantity,
      set: set_code || undefined,
      collector_number: collector_number || undefined,
      isFoil,
      csvPrice,
    });
  }

  return items;
}

interface ScryfallCollectionCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  mana_cost?: string;
  type_line?: string;
  colors?: string[];
  rarity?: string;
  prices?: {
    eur?: string | null;
    eur_foil?: string | null;
    usd?: string | null;
  };
  image_uris?: {
    normal?: string;
    large?: string;
  };
  card_faces?: Array<{
    image_uris?: {
      normal?: string;
    };
  }>;
}

export async function fetchScryfallCollectionBatch(
  items: ParsedBuylistItem[]
): Promise<Map<string, ScryfallCollectionCard>> {
  const cardMap = new Map<string, ScryfallCollectionCard>();
  if (items.length === 0) return cardMap;

  // Process in chunks of 75 (Scryfall API maximum)
  const chunkSize = 75;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const identifiers = chunk.map((item) => {
      if (item.set && item.collector_number) {
        return { name: item.name, set: item.set, collector_number: item.collector_number };
      }
      if (item.set) {
        return { name: item.name, set: item.set };
      }
      return { name: item.name };
    });

    try {
      const res = await fetch('https://api.scryfall.com/cards/collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'KartyMTG/1.0',
          Accept: 'application/json',
        },
        body: JSON.stringify({ identifiers }),
      });

      if (!res.ok) {
        console.error('Scryfall collection API error:', res.status, await res.text());
        continue;
      }

      const json = await res.json();
      if (Array.isArray(json.data)) {
        for (const card of json.data as ScryfallCollectionCard[]) {
          // Key by lowercased name, and also by set+number if available
          const lowerName = card.name.toLowerCase();
          if (!cardMap.has(lowerName)) {
            cardMap.set(lowerName, card);
          }
          if (card.set && card.collector_number) {
            cardMap.set(`${card.set.toLowerCase()}:${card.collector_number.toLowerCase()}`, card);
          }
        }
      }

      // If there were cards not found with specific set/number, try fallback by name only
      if (Array.isArray(json.not_found) && json.not_found.length > 0) {
        const retryByName = json.not_found
          .filter((nf: { name?: string }) => nf.name)
          .map((nf: { name: string }) => ({ name: nf.name }));

        if (retryByName.length > 0) {
          try {
            const fallbackRes = await fetch('https://api.scryfall.com/cards/collection', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'KartyMTG/1.0',
                Accept: 'application/json',
              },
              body: JSON.stringify({ identifiers: retryByName }),
            });
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              if (Array.isArray(fallbackJson.data)) {
                for (const card of fallbackJson.data as ScryfallCollectionCard[]) {
                  cardMap.set(card.name.toLowerCase(), card);
                }
              }
            }
          } catch (fbErr) {
            console.error('Fallback Scryfall collection error:', fbErr);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching Scryfall batch:', err);
    }
  }

  return cardMap;
}

export interface ConvertOptions {
  pricingMode: 'percent' | 'fixed' | 'csv';
  percentRate: number; // e.g. 75
  fixedPrice: number; // e.g. 10.00
  eurRate: number; // e.g. 4.30
  defaultMinCondition: string; // 'LP'
  defaultFoil: number; // 2: any, 1: foil, 0: non-foil
  defaultNotes?: string;
}

export async function convertParsedItemsToBuylistPreview(
  items: ParsedBuylistItem[],
  options: ConvertOptions
): Promise<BuylistBulkPreviewItem[]> {
  const cardMap = await fetchScryfallCollectionBatch(items);
  const results: BuylistBulkPreviewItem[] = [];

  for (const item of items) {
    let scryfallCard: ScryfallCollectionCard | undefined;
    if (item.set && item.collector_number) {
      scryfallCard = cardMap.get(`${item.set.toLowerCase()}:${item.collector_number.toLowerCase()}`);
    }
    if (!scryfallCard) {
      scryfallCard = cardMap.get(item.name.toLowerCase());
    }

    let imageUrl = '';
    let marketEur: number | null = null;

    if (scryfallCard) {
      imageUrl = scryfallCard.image_uris?.normal || scryfallCard.image_uris?.large || '';
      if (!imageUrl && scryfallCard.card_faces && scryfallCard.card_faces[0]?.image_uris) {
        imageUrl = scryfallCard.card_faces[0].image_uris.normal || '';
      }
      if (!imageUrl) {
        imageUrl = getScryfallDirectImageUrl(scryfallCard.id);
      }

      if (scryfallCard.prices?.eur) {
        marketEur = parseFloat(scryfallCard.prices.eur);
      } else if (scryfallCard.prices?.usd) {
        marketEur = parseFloat(scryfallCard.prices.usd) * 0.9;
      }
    }

    // Determine price
    let finalPrice = options.fixedPrice;
    if (options.pricingMode === 'percent') {
      if (marketEur && marketEur > 0) {
        const calculated = marketEur * options.eurRate * (options.percentRate / 100);
        // Round nicely: e.g. 12.34 -> 12.50 or round to nearest 0.50 PLN
        finalPrice = Math.max(1, Math.round(calculated * 2) / 2);
      } else {
        finalPrice = options.fixedPrice || 5.00;
      }
    } else if (options.pricingMode === 'csv' && item.csvPrice !== undefined && item.csvPrice > 0) {
      finalPrice = item.csvPrice;
    }

    const foilSetting = item.isFoil ? 1 : options.defaultFoil;

    results.push({
      name: scryfallCard ? scryfallCard.name : item.name,
      set_code: scryfallCard ? scryfallCard.set.toLowerCase() : item.set || null,
      set_name: scryfallCard ? scryfallCard.set_name : null,
      collector_number: scryfallCard ? scryfallCard.collector_number : item.collector_number || null,
      scryfall_id: scryfallCard ? scryfallCard.id : null,
      image_url: imageUrl || null,
      mana_cost: scryfallCard?.mana_cost || '',
      colors: JSON.stringify(scryfallCard?.colors || []),
      type_line: scryfallCard?.type_line || 'Magic: The Gathering',
      rarity: scryfallCard?.rarity || 'common',
      min_condition: options.defaultMinCondition || 'LP',
      foil: foilSetting,
      language: 'en',
      price_pln: finalPrice,
      quantity: item.quantity || 1,
      notes: options.defaultNotes ? options.defaultNotes.trim() : null,
      market_eur: marketEur,
    });
  }

  return results;
}
