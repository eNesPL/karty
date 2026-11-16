import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getDb, resetDbInstance } from '@/lib/db';
import { verifyMtgspotSyncRequest } from '@/lib/auth';
import {
  buildDeterministicExternalId,
  getActiveMtgspotWantlist,
  getAdminMtgspotOffersOverview,
  getMtgspotIntegrationStatus,
  processIncomingMtgspotOffers,
  sanitizeIntegrationError,
  validateOffersPayload,
} from '@/lib/mtgspot';
import { GET as getWantlistRoute } from '@/app/api/integrations/mtgspot/wantlist/route';
import { POST as postOffersRoute } from '@/app/api/integrations/mtgspot/offers/route';
import { GET as getStatusRoute } from '@/app/api/integrations/mtgspot/status/route';
import { GET as getAdminOffersRoute } from '@/app/api/admin/buylist/mtgspot-offers/route';

describe('Karty <-> MTGSpot Integration Suite', () => {
  let tmpDir: string;
  const TEST_TOKEN = 'test-integration-secret-token-987654';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'karty-mtgspot-test-'));
    process.env.KARTY_DB_PATH = path.join(tmpDir, 'test_karty.db');
    process.env.MTGSPOT_SYNC_TOKEN = TEST_TOKEN;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'test';
    resetDbInstance();
  });

  afterEach(() => {
    resetDbInstance();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('1. enforces Bearer token authentication (401 on missing, 403 on invalid, 200 on valid) and HTTPS in production', async () => {
    // Missing token -> 401
    const reqMissing = new Request('http://localhost:3000/api/integrations/mtgspot/wantlist');
    const resMissing = await getWantlistRoute(reqMissing);
    assert.equal(resMissing.status, 401);

    // Invalid token (e.g. admin password 'haslo' or wrong secret) -> 403
    const reqInvalid = new Request('http://localhost:3000/api/integrations/mtgspot/wantlist', {
      headers: { Authorization: 'Bearer haslo' },
    });
    const resInvalid = await getWantlistRoute(reqInvalid);
    assert.equal(resInvalid.status, 403);

    // Valid token -> 200
    const reqValid = new Request('http://localhost:3000/api/integrations/mtgspot/wantlist', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    const resValid = await getWantlistRoute(reqValid);
    assert.equal(resValid.status, 200);

    // HTTPS requirement in production
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.ALLOW_INSECURE_INTEGRATION_HTTP;

    const reqHttpProd = new Request('http://karty.example.com/api/integrations/mtgspot/wantlist', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    const authHttpProd = verifyMtgspotSyncRequest(reqHttpProd);
    assert.equal(authHttpProd.authorized, false);
    assert.equal(authHttpProd.status, 403);

    const reqHttpsProd = new Request('https://karty.example.com/api/integrations/mtgspot/wantlist', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    const authHttpsProd = verifyMtgspotSyncRequest(reqHttpsProd);
    assert.equal(authHttpsProd.authorized, true);
    assert.equal(authHttpsProd.status, 200);
  });

  it('2. returns only active buylist items with target_price separated from offer price on GET /api/integrations/mtgspot/wantlist', async () => {
    const db = getDb();
    // Deactivate one seeded card and set quantity=0 on another
    db.prepare('UPDATE buylist_cards SET active = 0 WHERE id = 1').run();
    db.prepare('UPDATE buylist_cards SET quantity = 0 WHERE id = 2').run();

    const req = new Request('http://localhost:3000/api/integrations/mtgspot/wantlist', {
      headers: { Authorization: `Bearer ${TEST_TOKEN}` },
    });
    const res = await getWantlistRoute(req);
    assert.equal(res.status, 200);
    const body = (await res.json()) as { items: Array<Record<string, unknown>>; count: number };

    assert.equal(body.count, 1);
    assert.equal(body.items.length, 1);
    const item = body.items[0];
    assert.equal(item.id, 3);
    assert.equal(item.card_name, 'Flooded Strand');
    assert.equal(item.target_price, 45.0);
    assert.equal(item.quantity, 4);
    assert.equal(item.condition, 'LP');
    assert.equal(item.is_foil, null);
    assert.equal(item.set_code, 'mh3');
    assert.equal(item.collector_number, '220');
    assert.equal(item.active, true);
  });

  it('3. validates incoming offers payload and rejects invalid prices, negative stock, or non-existent buylist_item_id', async () => {
    getDb(); // initialize schema & seed

    // Invalid price (<= 0) -> 400
    const badPriceValidation = validateOffersPayload({
      offers: [
        {
          external_id: 'off_1',
          buylist_item_id: 1,
          card_name: 'Orcish Bowmasters',
          price: 0,
          stock: 2,
          scraped_at: '2026-11-16T10:00:00Z',
        },
      ],
    });
    assert.equal(badPriceValidation.valid, false);

    // Negative stock -> 400
    const badStockValidation = validateOffersPayload({
      offers: [
        {
          external_id: 'off_1',
          buylist_item_id: 1,
          card_name: 'Orcish Bowmasters',
          price: 120,
          stock: -1,
          scraped_at: '2026-11-16T10:00:00Z',
        },
      ],
    });
    assert.equal(badStockValidation.valid, false);

    // Non-existent buylist_item_id -> 400 via POST /api/integrations/mtgspot/offers
    const reqNonExistent = new Request('http://localhost:3000/api/integrations/mtgspot/offers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offers: [
          {
            external_id: 'off_999',
            buylist_item_id: 9999,
            card_name: 'Non-existent Card',
            price: 50.0,
            stock: 1,
            scraped_at: '2026-11-16T10:00:00Z',
          },
        ],
      }),
    });
    const resNonExistent = await postOffersRoute(reqNonExistent);
    assert.equal(resNonExistent.status, 400);
  });

  it('4. performs idempotent upsert of multiple offers, updates price/stock, and safely marks stale offers unavailable ONLY on confirmed scan', async () => {
    getDb(); // seed buylist_cards (ids 1, 2, 3)

    // --- Sync 1: Push 2 offers for item #1 (Orcish Bowmasters) and 1 offer for item #2 (Sheoldred) ---
    const sync1Payload = {
      offers: [
        {
          external_id: 'mtgspot_art_101',
          buylist_item_id: 1,
          card_name: 'Orcish Bowmasters',
          price: 129.99,
          stock: 3,
          condition: 'NM',
          is_foil: false,
          expansion: 'The Lord of the Rings: Tales of Middle-earth',
          card_url: 'https://mtgspot.pl/single/bowmasters-101',
          scraped_at: '2026-11-16T10:00:00Z',
        },
        {
          external_id: 'mtgspot_art_102',
          buylist_item_id: 1,
          card_name: 'Orcish Bowmasters',
          price: 145.0,
          stock: 1,
          condition: 'NM',
          is_foil: true,
          expansion: 'The Lord of the Rings: Tales of Middle-earth',
          card_url: 'https://mtgspot.pl/single/bowmasters-102',
          scraped_at: '2026-11-16T10:00:00Z',
        },
        {
          external_id: 'mtgspot_art_201',
          buylist_item_id: 2,
          card_name: 'Sheoldred, the Apocalypse',
          price: 260.0,
          stock: 2,
          condition: 'NM',
          is_foil: false,
          expansion: 'Dominaria United',
          card_url: 'https://mtgspot.pl/single/sheoldred-201',
          requires_verification: true,
          verification_note: 'Brak numeru kolekcjonerskiego w MTGSpot',
          scraped_at: '2026-11-16T10:00:00Z',
        },
      ],
      synced_buylist_item_ids: [1, 2, 3],
      sync_completed: true,
      sync_meta: {
        status: 'ok',
        items_checked: 3,
        offers_found: 3,
        errors_count: 0,
      },
    };

    const res1 = await postOffersRoute(
      new Request('http://localhost:3000/api/integrations/mtgspot/offers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sync1Payload),
      })
    );
    assert.equal(res1.status, 200);
    const data1 = (await res1.json()) as Record<string, unknown>;
    assert.equal(data1.upserted_count, 3);
    assert.equal(data1.marked_unavailable_count, 0);

    // --- Sync 2: Item #1 has 1 updated offer (price 119.99, stock 5) and art_102 disappeared;
    // Item #2 had a scraper error so it is NOT in synced_buylist_item_ids! ---
    const sync2Payload = {
      offers: [
        {
          external_id: 'mtgspot_art_101',
          buylist_item_id: 1,
          card_name: 'Orcish Bowmasters',
          price: 119.99,
          stock: 5,
          condition: 'NM',
          is_foil: false,
          expansion: 'The Lord of the Rings: Tales of Middle-earth',
          card_url: 'https://mtgspot.pl/single/bowmasters-101',
          scraped_at: '2026-11-16T10:05:00Z',
        },
      ],
      synced_buylist_item_ids: [1, 3], // Item #2 excluded due to simulated MTGSpot error!
      sync_completed: true,
      sync_meta: {
        status: 'partial',
        items_checked: 3,
        offers_found: 1,
        errors_count: 1,
        last_error: 'Timeout querying MTGSpot for Sheoldred',
      },
    };

    const res2 = await postOffersRoute(
      new Request('http://localhost:3000/api/integrations/mtgspot/offers', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sync2Payload),
      })
    );
    assert.equal(res2.status, 200);
    const data2 = (await res2.json()) as Record<string, unknown>;
    assert.equal(data2.upserted_count, 1);
    // Only art_102 from item #1 is marked unavailable; art_201 from item #2 MUST stay available!
    assert.equal(data2.marked_unavailable_count, 1);

    // Check admin overview and status
    const adminReq = new Request('http://localhost:3000/api/admin/buylist/mtgspot-offers', {
      headers: { 'x-admin-password': 'haslo' },
    });
    const adminRes = await getAdminOffersRoute(adminReq);
    assert.equal(adminRes.status, 200);
    const overview = (await adminRes.json()) as ReturnType<typeof getAdminMtgspotOffersOverview>;

    const allOffers = overview.items.flatMap((group) => group.offers);
    // Total offers in DB is still 3 (no duplicate created for art_101)
    assert.equal(allOffers.length, 3);

    const item1Group = overview.items.find((g) => g.buylist_card.id === 1)!;
    // Target price from buylist_cards (135 PLN) is preserved separately from offer price (119.99 PLN)
    assert.equal(item1Group.target_price, 135.0);

    const art101 = allOffers.find((o) => o.external_id === 'mtgspot_art_101')!;
    assert.equal(art101.price, 119.99);
    assert.equal(art101.stock, 5);
    assert.equal(art101.is_available, 1);

    const art102 = allOffers.find((o) => o.external_id === 'mtgspot_art_102')!;
    assert.equal(art102.is_available, 0);
    assert.equal(art102.stock, 0);

    // CRITICAL: art201 (item #2) was NOT in synced_buylist_item_ids, so it remains available!
    const art201 = allOffers.find((o) => o.external_id === 'mtgspot_art_201')!;
    assert.equal(art201.is_available, 1);
    assert.equal(art201.stock, 2);
    assert.equal(art201.requires_verification, 1);

    // Check GET /api/integrations/mtgspot/status
    const statusRes = await getStatusRoute(
      new Request('http://localhost:3000/api/integrations/mtgspot/status', {
        headers: { Authorization: `Bearer ${TEST_TOKEN}` },
      })
    );
    assert.equal(statusRes.status, 200);
    const statusBody = (await statusRes.json()) as ReturnType<typeof getMtgspotIntegrationStatus>;
    assert.equal(statusBody.status, 'partial');
    assert.equal(statusBody.available_offers, 2);
    assert.equal(statusBody.total_offers, 3);
    assert.match(statusBody.last_error || '', /Timeout querying MTGSpot/);
  });

  it('5. redacts secrets from error messages and generates deterministic fallback external_ids', () => {
    const errWithSecret = new Error(`Failed request with Authorization: Bearer ${TEST_TOKEN} (${TEST_TOKEN})`);
    const sanitized = sanitizeIntegrationError(errWithSecret);
    assert.equal(sanitized.includes(TEST_TOKEN), false);
    assert.equal(sanitized.includes('[REDACTED]'), true);

    const id1 = buildDeterministicExternalId({
      card_name: 'Flooded Strand',
      expansion: 'Modern Horizons 3',
      condition: 'NM',
      is_foil: false,
      card_url: 'https://mtgspot.pl/single/flooded-strand',
    });
    const id2 = buildDeterministicExternalId({
      card_name: 'Flooded Strand',
      expansion: 'Modern Horizons 3',
      condition: 'NM',
      is_foil: false,
      card_url: 'https://mtgspot.pl/single/flooded-strand',
    });
    assert.equal(id1, id2);
    assert.equal(id1.startsWith('det_'), true);
  });
});
