import Papa from 'papaparse';
import { getScryfallDirectImageUrl, fetchScryfallCardById } from './scryfall';

export interface ManaBoxRow {
  name: string;
  set_code: string;
  set_name: string;
  collector_number: string;
  scryfall_id: string;
  foil: boolean;
  rarity: string;
  quantity: number;
  condition: string;
  language: string;
  purchase_price: number;
  purchase_price_currency: string;
}

export interface ParsedCardItem {
  name: string;
  set_code: string;
  set_name: string;
  collector_number: string;
  scryfall_id: string;
  image_url: string;
  foil: number;
  rarity: string;
  condition: string;
  language: string;
  price_pln: number;
  price_eur: number | null;
  quantity: number;
  colors: string;
  type_line?: string;
  mana_cost?: string;
}

export function parseManaBoxCSV(csvContent: string): ManaBoxRow[] {
  const result = Papa.parse<Record<string, string>>(csvContent.trim(), {
    header: true,
    skipEmptyLines: true,
  });

  const rows: ManaBoxRow[] = [];

  for (const raw of result.data) {
    // Find keys case-insensitively
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
    const set_name = getVal(['set name', 'set_name', 'expansion']);
    const collector_number = getVal(['collector number', 'collector_number', 'card number', 'number']);
    const scryfall_id = getVal(['scryfall id', 'scryfall_id', 'scryfallid']);
    const foilRaw = getVal(['foil', 'is_foil', 'finish']).toLowerCase();
    const isFoil = foilRaw === 'true' || foilRaw === 'foil' || foilRaw === 'etched';

    const rarity = getVal(['rarity']) || 'common';
    const quantityRaw = parseInt(getVal(['quantity', 'count', 'qty']), 10);
    const quantity = isNaN(quantityRaw) || quantityRaw < 1 ? 1 : quantityRaw;

    const conditionRaw = getVal(['condition']) || 'NM';
    let condition = 'NM';
    const cLower = conditionRaw.toLowerCase();
    if (cLower.includes('near') || cLower === 'nm') condition = 'NM';
    else if (cLower.includes('light') || cLower === 'lp' || cLower.includes('ex')) condition = 'LP/EX';
    else if (cLower.includes('moderate') || cLower === 'mp') condition = 'MP';
    else if (cLower.includes('heavy') || cLower === 'hp') condition = 'HP';
    else if (cLower.includes('damaged') || cLower === 'dmg') condition = 'DMG';

    const language = getVal(['language', 'lang']) || 'en';
    const priceRaw = parseFloat(getVal(['purchase price', 'price', 'purchase_price']).replace(',', '.'));
    const purchase_price = isNaN(priceRaw) ? 0 : priceRaw;
    const purchase_price_currency = getVal(['purchase price currency', 'currency', 'price_currency']) || 'PLN';

    rows.push({
      name,
      set_code,
      set_name,
      collector_number,
      scryfall_id,
      foil: isFoil,
      rarity,
      quantity,
      condition,
      language,
      purchase_price,
      purchase_price_currency,
    });
  }

  return rows;
}

export async function convertManaBoxRowsToCards(
  rows: ManaBoxRow[],
  eurToPlnRate = 4.30,
  priceMode: 'csv' | 'scryfall' | 'fixed' = 'csv',
  fixedPrice = 10,
  convertNmToLp = false
): Promise<ParsedCardItem[]> {
  const cards: ParsedCardItem[] = [];

  for (const row of rows) {
    let pricePln = 0;
    let priceEur: number | null = null;
    let imageUrl = '';
    let colors = '[]';
    let typeLine = '';
    let manaCost = '';

    if (row.scryfall_id) {
      imageUrl = getScryfallDirectImageUrl(row.scryfall_id);
    }

    if (priceMode === 'fixed') {
      pricePln = fixedPrice;
    } else if (priceMode === 'scryfall' && row.scryfall_id) {
      // Fetch live price from Scryfall
      const scryfallCard = await fetchScryfallCardById(row.scryfall_id);
      if (scryfallCard) {
        if (!imageUrl) imageUrl = scryfallCard.image_url;
        typeLine = scryfallCard.type_line || '';
        manaCost = scryfallCard.mana_cost || '';
        colors = JSON.stringify(scryfallCard.colors || []);

        const eurStr = row.foil ? scryfallCard.prices.eur_foil || scryfallCard.prices.eur : scryfallCard.prices.eur;
        if (eurStr) {
          priceEur = parseFloat(eurStr);
          pricePln = Math.round(priceEur * eurToPlnRate * 100) / 100;
        }
      }
    }

    // Fallback to purchase price from CSV if pricePln is still 0
    if (pricePln <= 0) {
      if (row.purchase_price > 0) {
        if (row.purchase_price_currency.toUpperCase() === 'EUR') {
          priceEur = row.purchase_price;
          pricePln = Math.round(row.purchase_price * eurToPlnRate * 100) / 100;
        } else if (row.purchase_price_currency.toUpperCase() === 'USD') {
          pricePln = Math.round(row.purchase_price * 4.0 * 100) / 100;
        } else {
          pricePln = row.purchase_price;
        }
      } else {
        // default fallback price if nothing provided
        pricePln = 5.0;
      }
    }

    let condition = row.condition;
    if (convertNmToLp && (condition === 'NM' || condition === 'Near Mint')) {
      condition = 'LP/EX';
    }

    cards.push({
      name: row.name,
      set_code: row.set_code,
      set_name: row.set_name,
      collector_number: row.collector_number,
      scryfall_id: row.scryfall_id,
      image_url: imageUrl,
      foil: row.foil ? 1 : 0,
      rarity: row.rarity,
      condition,
      language: row.language,
      price_pln: pricePln,
      price_eur: priceEur,
      quantity: row.quantity,
      colors,
      type_line: typeLine,
      mana_cost: manaCost,
    });
  }

  return cards;
}
