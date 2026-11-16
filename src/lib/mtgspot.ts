import crypto from 'node:crypto';
import { getDb } from '@/lib/db';
import type {
  BuylistCard,
  MtgspotScrapedOffer,
  MtgspotSyncStatus,
  MtgspotWantlistItem,
} from '@/lib/types';

export function sanitizeIntegrationError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || '');
  const trimmed = raw.trim().slice(0, 500);
  const syncToken = process.env.MTGSPOT_SYNC_TOKEN?.trim();
  let sanitized = trimmed;
  if (syncToken && syncToken.length >= 4) {
    sanitized = sanitized.split(syncToken).join('[REDACTED]');
  }
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]');
  return sanitized;
}

export function mapBuylistCardToWantlistItem(card: BuylistCard): MtgspotWantlistItem {
  const foilVal = card.foil === 1 ? true : card.foil === 0 ? false : null;
  const condVal =
    card.min_condition && card.min_condition.toUpperCase() !== 'ANY'
      ? card.min_condition.trim()
      : null;
  const expansionVal = card.set_name?.trim() || card.set_code?.trim() || null;
  const isActive = (card.active === undefined || card.active === 1) && card.quantity > 0;

  return {
    id: card.id,
    card_name: card.name,
    target_price: Number(card.price_pln),
    quantity: Number(card.quantity),
    condition: condVal,
    is_foil: foilVal,
    expansion: expansionVal,
    active: isActive,
    set_code: card.set_code ? card.set_code.trim().toLowerCase() : null,
    set_name: card.set_name ? card.set_name.trim() : null,
    collector_number: card.collector_number ? card.collector_number.trim() : null,
    scryfall_id: card.scryfall_id ? card.scryfall_id.trim() : null,
    language: card.language ? card.language.trim() : 'en',
  };
}

export function getActiveMtgspotWantlist(): MtgspotWantlistItem[] {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT * FROM buylist_cards WHERE quantity > 0 AND COALESCE(active, 1) = 1 ORDER BY id ASC'
    )
    .all() as unknown as BuylistCard[];

  return rows.map(mapBuylistCardToWantlistItem);
}

export interface IncomingMtgspotOfferInput {
  external_id: string;
  buylist_item_id: number;
  card_name: string;
  price: number;
  stock: number;
  condition: string | null;
  is_foil: boolean;
  expansion: string | null;
  card_url: string | null;
  image_url: string | null;
  language: string | null;
  requires_verification: boolean;
  verification_note: string | null;
  scraped_at: string;
}

export interface ValidatedOffersPayload {
  offers: IncomingMtgspotOfferInput[];
  syncedBuylistItemIds: number[];
  allowMarkUnavailable: boolean;
  itemsProcessedCount: number | null;
  syncStatusHint: 'ok' | 'partial' | 'error';
  syncError: string | null;
}

export function buildDeterministicExternalId(input: {
  external_id?: string | number | null;
  card_name: string;
  expansion?: string | null;
  condition?: string | null;
  is_foil?: boolean | number | null;
  card_url?: string | null;
  language?: string | null;
}): string {
  if (input.external_id !== undefined && input.external_id !== null) {
    const extStr = String(input.external_id).trim();
    if (extStr.length > 0) {
      return extStr;
    }
  }

  const canonical = [
    input.card_name.trim().toLowerCase(),
    (input.expansion || '').trim().toLowerCase(),
    (input.condition || 'NM').trim().toUpperCase(),
    input.is_foil ? 'foil' : 'nonfoil',
    (input.language || 'en').trim().toLowerCase(),
    (input.card_url || '').trim().toLowerCase(),
  ].join('|');

  const digest = crypto.createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 32);
  return `det_${digest}`;
}

export function validateOffersPayload(
  rawBody: unknown
): { valid: true; data: ValidatedOffersPayload } | { valid: false; error: string } {
  if (!rawBody || (typeof rawBody !== 'object' && !Array.isArray(rawBody))) {
    return { valid: false, error: 'Nieprawidłowy format JSON żądania.' };
  }

  let rawOffers: unknown[];
  let rawSyncedIds: unknown = undefined;
  let syncCompleted = true;
  let itemsProcessedCount: number | null = null;
  let syncStatusHint: 'ok' | 'partial' | 'error' = 'ok';
  let syncError: string | null = null;

  if (Array.isArray(rawBody)) {
    rawOffers = rawBody;
  } else {
    const bodyObj = rawBody as Record<string, unknown>;
    if (!Array.isArray(bodyObj.offers)) {
      return { valid: false, error: 'Pole "offers" musi być tablicą ofert.' };
    }
    rawOffers = bodyObj.offers;
    rawSyncedIds = bodyObj.synced_buylist_item_ids ?? bodyObj.completed_buylist_item_ids;
    if (typeof bodyObj.sync_completed === 'boolean') {
      syncCompleted = bodyObj.sync_completed;
    }
    if (bodyObj.sync_meta && typeof bodyObj.sync_meta === 'object') {
      const meta = bodyObj.sync_meta as Record<string, unknown>;
      if (typeof meta.items_checked === 'number' && Number.isInteger(meta.items_checked) && meta.items_checked >= 0) {
        itemsProcessedCount = meta.items_checked;
      }
      if (meta.status === 'error') {
        syncStatusHint = 'error';
        syncCompleted = false;
      } else if (meta.status === 'partial') {
        syncStatusHint = 'partial';
      }
      if (typeof meta.last_error === 'string' && meta.last_error.trim()) {
        syncError = sanitizeIntegrationError(meta.last_error);
      }
    }
  }

  if (rawOffers.length > 5000) {
    return { valid: false, error: 'Przekroczono maksymalną liczbę ofert w jednym żądaniu (5000).' };
  }

  const syncedBuylistItemIds: number[] = [];
  if (rawSyncedIds !== undefined && rawSyncedIds !== null) {
    if (!Array.isArray(rawSyncedIds)) {
      return { valid: false, error: 'Pole "synced_buylist_item_ids" musi być tablicą identyfikatorów.' };
    }
    for (const rawId of rawSyncedIds) {
      if (typeof rawId !== 'number' || !Number.isInteger(rawId) || rawId <= 0) {
        return {
          valid: false,
          error: 'Każdy identyfikator w "synced_buylist_item_ids" musi być dodatnią liczbą całkowitą.',
        };
      }
      if (!syncedBuylistItemIds.includes(rawId)) {
        syncedBuylistItemIds.push(rawId);
      }
    }
  }

  const normalizedOffers: IncomingMtgspotOfferInput[] = [];

  for (let i = 0; i < rawOffers.length; i++) {
    const item = rawOffers[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, error: `Oferta na pozycji ${i} nie jest poprawnym obiektem.` };
    }
    const obj = item as Record<string, unknown>;

    // buylist_item_id
    const buylistItemId = obj.buylist_item_id;
    if (typeof buylistItemId !== 'number' || !Number.isInteger(buylistItemId) || buylistItemId <= 0) {
      return {
        valid: false,
        error: `Oferta #${i}: "buylist_item_id" musi być dodatnią liczbą całkowitą.`,
      };
    }

    // card_name
    if (typeof obj.card_name !== 'string' || obj.card_name.trim().length === 0) {
      return { valid: false, error: `Oferta #${i}: "card_name" musi być niepustym ciągiem znaków.` };
    }
    const cardName = obj.card_name.trim();
    if (cardName.length > 255) {
      return { valid: false, error: `Oferta #${i}: "card_name" przekracza 255 znaków.` };
    }

    // price
    if (typeof obj.price !== 'number' || !Number.isFinite(obj.price) || obj.price < 0 || obj.price > 1_000_000) {
      return {
        valid: false,
        error: `Oferta #${i}: "price" musi być poprawną nieujemną liczbą (0 - 1000000).`,
      };
    }

    // stock
    if (typeof obj.stock !== 'number' || !Number.isInteger(obj.stock) || obj.stock < 0 || obj.stock > 100_000) {
      return {
        valid: false,
        error: `Oferta #${i}: "stock" musi być nieujemną liczbą całkowitą (0 - 100000).`,
      };
    }

    // condition
    let condition: string | null = null;
    if (obj.condition !== undefined && obj.condition !== null) {
      if (typeof obj.condition !== 'string') {
        return { valid: false, error: `Oferta #${i}: "condition" musi być ciągiem znaków lub null.` };
      }
      const trimmedCond = obj.condition.trim();
      if (trimmedCond.length > 50) {
        return { valid: false, error: `Oferta #${i}: "condition" przekracza 50 znaków.` };
      }
      condition = trimmedCond || null;
    }

    // is_foil
    let isFoil = false;
    if (typeof obj.is_foil === 'boolean') {
      isFoil = obj.is_foil;
    } else if (obj.is_foil === 1 || obj.is_foil === 0) {
      isFoil = obj.is_foil === 1;
    } else {
      return { valid: false, error: `Oferta #${i}: "is_foil" musi być wartością logiczną (boolean).` };
    }

    // expansion
    let expansion: string | null = null;
    if (obj.expansion !== undefined && obj.expansion !== null) {
      if (typeof obj.expansion !== 'string') {
        return { valid: false, error: `Oferta #${i}: "expansion" musi być ciągiem znaków lub null.` };
      }
      const trimmedExp = obj.expansion.trim();
      if (trimmedExp.length > 255) {
        return { valid: false, error: `Oferta #${i}: "expansion" przekracza 255 znaków.` };
      }
      expansion = trimmedExp || null;
    }

    // card_url
    let cardUrl: string | null = null;
    if (obj.card_url !== undefined && obj.card_url !== null && obj.card_url !== '') {
      if (typeof obj.card_url !== 'string') {
        return { valid: false, error: `Oferta #${i}: "card_url" musi być ciągiem znaków lub null.` };
      }
      const trimmedUrl = obj.card_url.trim();
      if (trimmedUrl.length > 1024) {
        return { valid: false, error: `Oferta #${i}: "card_url" przekracza 1024 znaki.` };
      }
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        return { valid: false, error: `Oferta #${i}: "card_url" musi być prawidłowym adresem HTTP/HTTPS.` };
      }
      cardUrl = trimmedUrl;
    }

    // image_url
    let imageUrl: string | null = null;
    if (obj.image_url !== undefined && obj.image_url !== null && obj.image_url !== '') {
      if (typeof obj.image_url !== 'string' || obj.image_url.trim().length > 1024) {
        return { valid: false, error: `Oferta #${i}: "image_url" jest nieprawidłowe.` };
      }
      imageUrl = obj.image_url.trim();
    }

    // language
    let language: string | null = null;
    if (obj.language !== undefined && obj.language !== null && obj.language !== '') {
      if (typeof obj.language !== 'string' || obj.language.trim().length > 64) {
        return { valid: false, error: `Oferta #${i}: "language" jest nieprawidłowe.` };
      }
      language = obj.language.trim();
    }

    // scraped_at
    if (typeof obj.scraped_at !== 'string' || obj.scraped_at.trim().length === 0 || obj.scraped_at.trim().length > 64) {
      return {
        valid: false,
        error: `Oferta #${i}: "scraped_at" musi być niepustym znacznikiem czasu (max 64 znaki).`,
      };
    }
    const scrapedAt = obj.scraped_at.trim();

    // external_id
    if (obj.external_id !== undefined && obj.external_id !== null) {
      if (typeof obj.external_id !== 'string' && typeof obj.external_id !== 'number') {
        return { valid: false, error: `Oferta #${i}: "external_id" musi być ciągiem znaków lub liczbą.` };
      }
      if (String(obj.external_id).trim().length > 255) {
        return { valid: false, error: `Oferta #${i}: "external_id" przekracza 255 znaków.` };
      }
    }
    const externalId = buildDeterministicExternalId({
      external_id: obj.external_id as string | number | null | undefined,
      card_name: cardName,
      expansion,
      condition,
      is_foil: isFoil,
      card_url: cardUrl,
      language,
    });

    // requires_verification & verification_note
    const requiresVerification = Boolean(obj.requires_verification);
    let verificationNote: string | null = null;
    if (typeof obj.verification_note === 'string' && obj.verification_note.trim()) {
      verificationNote = obj.verification_note.trim().slice(0, 500);
    }

    normalizedOffers.push({
      external_id: externalId,
      buylist_item_id: buylistItemId,
      card_name: cardName,
      price: Math.round(obj.price * 100) / 100,
      stock: obj.stock,
      condition,
      is_foil: isFoil,
      expansion,
      card_url: cardUrl,
      image_url: imageUrl,
      language,
      requires_verification: requiresVerification,
      verification_note: verificationNote,
      scraped_at: scrapedAt,
    });
  }

  return {
    valid: true,
    data: {
      offers: normalizedOffers,
      syncedBuylistItemIds,
      allowMarkUnavailable: syncCompleted && syncStatusHint !== 'error',
      itemsProcessedCount,
      syncStatusHint,
      syncError,
    },
  };
}

export interface ProcessOffersResult {
  upsertedCount: number;
  markedUnavailableCount: number;
  itemsProcessed: number;
}

export function processIncomingMtgspotOffers(
  payload: ValidatedOffersPayload
): { ok: true; result: ProcessOffersResult } | { ok: false; status: number; error: string } {
  const db = getDb();

  // Verify that all referenced buylist_item_ids exist in buylist_cards
  const referencedIds = new Set<number>(payload.syncedBuylistItemIds);
  for (const offer of payload.offers) {
    referencedIds.add(offer.buylist_item_id);
  }

  if (referencedIds.size > 0) {
    const checkStmt = db.prepare('SELECT id FROM buylist_cards WHERE id = ?');
    for (const itemId of referencedIds) {
      const existing = checkStmt.get(itemId) as { id: number } | undefined;
      if (!existing) {
        return {
          ok: false,
          status: 400,
          error: `Pozycja buylisty o ID ${itemId} nie istnieje w bazie Karty.`,
        };
      }
    }
  }

  const nowIso = new Date().toISOString();
  let upsertedCount = 0;
  let markedUnavailableCount = 0;

  // Deduplicate within the same request by (buylist_item_id, external_id) keeping latest
  const deduplicatedMap = new Map<string, IncomingMtgspotOfferInput>();
  for (const offer of payload.offers) {
    const key = `${offer.buylist_item_id}::${offer.external_id}`;
    deduplicatedMap.set(key, offer);
  }
  const uniqueOffers = Array.from(deduplicatedMap.values());

  db.exec('BEGIN TRANSACTION;');
  try {
    const upsertStmt = db.prepare(`
      INSERT INTO mtgspot_buylist_offers (
        buylist_item_id, external_id, card_name, price, stock,
        condition, is_foil, expansion, card_url, image_url, language,
        is_available, requires_verification, verification_note,
        scraped_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(buylist_item_id, external_id) DO UPDATE SET
        card_name = excluded.card_name,
        price = excluded.price,
        stock = excluded.stock,
        condition = excluded.condition,
        is_foil = excluded.is_foil,
        expansion = excluded.expansion,
        card_url = COALESCE(excluded.card_url, mtgspot_buylist_offers.card_url),
        image_url = COALESCE(excluded.image_url, mtgspot_buylist_offers.image_url),
        language = COALESCE(excluded.language, mtgspot_buylist_offers.language),
        is_available = excluded.is_available,
        requires_verification = excluded.requires_verification,
        verification_note = excluded.verification_note,
        scraped_at = excluded.scraped_at,
        updated_at = excluded.updated_at
    `);

    const activeExternalIdsByItem = new Map<number, Set<string>>();

    for (const offer of uniqueOffers) {
      const isAvailable = offer.stock > 0 ? 1 : 0;
      upsertStmt.run(
        offer.buylist_item_id,
        offer.external_id,
        offer.card_name,
        offer.price,
        offer.stock,
        offer.condition,
        offer.is_foil ? 1 : 0,
        offer.expansion,
        offer.card_url,
        offer.image_url,
        offer.language,
        isAvailable,
        offer.requires_verification ? 1 : 0,
        offer.verification_note,
        offer.scraped_at,
        nowIso,
        nowIso
      );
      upsertedCount++;

      if (isAvailable === 1) {
        let set = activeExternalIdsByItem.get(offer.buylist_item_id);
        if (!set) {
          set = new Set<string>();
          activeExternalIdsByItem.set(offer.buylist_item_id, set);
        }
        set.add(offer.external_id);
      }
    }

    // Mark stale offers as unavailable ONLY for items with confirmed completed scan
    if (payload.allowMarkUnavailable && payload.syncedBuylistItemIds.length > 0) {
      const getExistingAvailableStmt = db.prepare(
        'SELECT id, external_id FROM mtgspot_buylist_offers WHERE buylist_item_id = ? AND is_available = 1'
      );
      const markUnavailableStmt = db.prepare(
        'UPDATE mtgspot_buylist_offers SET is_available = 0, stock = 0, updated_at = ? WHERE id = ?'
      );

      for (const syncedItemId of payload.syncedBuylistItemIds) {
        const currentActiveSet = activeExternalIdsByItem.get(syncedItemId) || new Set<string>();
        const existingRows = getExistingAvailableStmt.all(syncedItemId) as Array<{
          id: number;
          external_id: string;
        }>;
        for (const row of existingRows) {
          if (!currentActiveSet.has(row.external_id)) {
            markUnavailableStmt.run(nowIso, row.id);
            markedUnavailableCount++;
          }
        }
      }
    }

    const itemsProcessed =
      payload.itemsProcessedCount !== null
        ? payload.itemsProcessedCount
        : referencedIds.size;

    const finalStatus = payload.syncStatusHint;
    if (finalStatus === 'error') {
      db.prepare(`
        UPDATE mtgspot_sync_status
        SET status = 'error',
            last_attempt_at = ?,
            last_items_processed = ?,
            last_offers_processed = ?,
            last_error = ?
        WHERE id = 1
      `).run(nowIso, itemsProcessed, upsertedCount, payload.syncError || 'Błąd synchronizacji.');
    } else {
      db.prepare(`
        UPDATE mtgspot_sync_status
        SET status = ?,
            last_success_at = ?,
            last_attempt_at = ?,
            last_items_processed = ?,
            last_offers_processed = ?,
            last_error = ?
        WHERE id = 1
      `).run(
        finalStatus,
        nowIso,
        nowIso,
        itemsProcessed,
        upsertedCount,
        payload.syncError
      );
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return {
    ok: true,
    result: {
      upsertedCount,
      markedUnavailableCount,
      itemsProcessed:
        payload.itemsProcessedCount !== null
          ? payload.itemsProcessedCount
          : referencedIds.size,
    },
  };
}

export function recordMtgspotSyncError(
  errorMsg: string,
  itemsProcessed = 0,
  offersProcessed = 0
): void {
  const db = getDb();
  const nowIso = new Date().toISOString();
  const sanitized = sanitizeIntegrationError(errorMsg);
  db.prepare(`
    UPDATE mtgspot_sync_status
    SET status = 'error',
        last_attempt_at = ?,
        last_items_processed = ?,
        last_offers_processed = ?,
        last_error = ?
    WHERE id = 1
  `).run(nowIso, itemsProcessed, offersProcessed, sanitized);
}

export function getMtgspotIntegrationStatus(): MtgspotSyncStatus {
  const db = getDb();
  const statusRow = db
    .prepare('SELECT * FROM mtgspot_sync_status WHERE id = 1')
    .get() as
    | {
        status: 'idle' | 'ok' | 'partial' | 'error';
        last_success_at: string | null;
        last_attempt_at: string | null;
        last_items_processed: number;
        last_offers_processed: number;
        last_error: string | null;
      }
    | undefined;

  const counts = db
    .prepare(
      `SELECT
        COUNT(*) as total_offers,
        COALESCE(SUM(CASE WHEN is_available = 1 AND stock > 0 THEN 1 ELSE 0 END), 0) as available_offers
       FROM mtgspot_buylist_offers`
    )
    .get() as { total_offers: number; available_offers: number } | undefined;

  return {
    status: statusRow?.status || 'idle',
    last_success_at: statusRow?.last_success_at || null,
    last_attempt_at: statusRow?.last_attempt_at || null,
    last_items_processed: Number(statusRow?.last_items_processed || 0),
    last_offers_processed: Number(statusRow?.last_offers_processed || 0),
    last_error: statusRow?.last_error ? sanitizeIntegrationError(statusRow.last_error) : null,
    total_offers: Number(counts?.total_offers || 0),
    available_offers: Number(counts?.available_offers || 0),
  };
}

export interface BuylistItemWithMtgspotOffers {
  buylist_card: BuylistCard;
  target_price: number;
  total_offers_count: number;
  available_offers_count: number;
  cheapest_available_offer: MtgspotScrapedOffer | null;
  offers: MtgspotScrapedOffer[];
}

export function getAdminMtgspotOffersOverview(): {
  items: BuylistItemWithMtgspotOffers[];
  sync_status: MtgspotSyncStatus;
  can_trigger_remote_sync: boolean;
} {
  const db = getDb();
  const buylistCards = db
    .prepare('SELECT * FROM buylist_cards ORDER BY id DESC')
    .all() as unknown as BuylistCard[];

  const allOffers = db
    .prepare('SELECT * FROM mtgspot_buylist_offers ORDER BY is_available DESC, price ASC, id ASC')
    .all() as unknown as MtgspotScrapedOffer[];

  const offersByItemId = new Map<number, MtgspotScrapedOffer[]>();
  for (const offer of allOffers) {
    let list = offersByItemId.get(offer.buylist_item_id);
    if (!list) {
      list = [];
      offersByItemId.set(offer.buylist_item_id, list);
    }
    list.push(offer);
  }

  const items: BuylistItemWithMtgspotOffers[] = buylistCards.map((card) => {
    const cardOffers = offersByItemId.get(card.id) || [];
    const availableOffers = cardOffers.filter((o) => o.is_available === 1 && o.stock > 0);
    availableOffers.sort((a, b) => a.price - b.price);

    return {
      buylist_card: card,
      target_price: Number(card.price_pln),
      total_offers_count: cardOffers.length,
      available_offers_count: availableOffers.length,
      cheapest_available_offer: availableOffers.length > 0 ? availableOffers[0] : null,
      offers: cardOffers,
    };
  });

  const syncStatus = getMtgspotIntegrationStatus();
  const canTriggerRemoteSync = Boolean(
    process.env.MTGSPOT_SCRAPER_API_URL?.trim() && process.env.MTGSPOT_SYNC_TOKEN?.trim()
  );

  return {
    items,
    sync_status: syncStatus,
    can_trigger_remote_sync: canTriggerRemoteSync,
  };
}
