import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

let dbInstance: DatabaseSync | null = null;
let currentDbPath: string | null = null;

export function resetDbInstance(): void {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore close errors
    }
    dbInstance = null;
    currentDbPath = null;
  }
}

export function getDb(): DatabaseSync {
  const configuredPath = process.env.KARTY_DB_PATH
    ? path.resolve(process.env.KARTY_DB_PATH)
    : path.join(process.cwd(), 'data', 'karty.db');

  if (dbInstance && currentDbPath === configuredPath) {
    return dbInstance;
  }

  if (dbInstance && currentDbPath !== configuredPath) {
    resetDbInstance();
  }

  const dbDir = path.dirname(configuredPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(configuredPath);
  currentDbPath = configuredPath;

  // Enable WAL mode for better concurrency and performance
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Initialize tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      set_code TEXT,
      set_name TEXT,
      collector_number TEXT,
      scryfall_id TEXT,
      image_url TEXT,
      mana_cost TEXT,
      colors TEXT DEFAULT '[]',
      type_line TEXT,
      rarity TEXT,
      condition TEXT DEFAULT 'NM',
      foil INTEGER DEFAULT 0,
      language TEXT DEFAULT 'en',
      price_pln REAL NOT NULL,
      price_eur REAL DEFAULT 0,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_name TEXT NOT NULL,
      buyer_contact TEXT NOT NULL,
      pickup_day TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending', -- pending, completed, cancelled
      total_price_pln REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reservation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reservation_id INTEGER NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
      card_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price_pln REAL NOT NULL,
      card_name TEXT NOT NULL,
      set_code TEXT,
      collector_number TEXT,
      image_url TEXT,
      foil INTEGER DEFAULT 0,
      condition TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_cards_price ON cards(price_pln);
    CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
    CREATE INDEX IF NOT EXISTS idx_cards_set_code ON cards(set_code);
    CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
    CREATE INDEX IF NOT EXISTS idx_cards_foil ON cards(foil);
    CREATE INDEX IF NOT EXISTS idx_cards_quantity ON cards(quantity);

    CREATE TABLE IF NOT EXISTS buylist_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      set_code TEXT,
      set_name TEXT,
      collector_number TEXT,
      scryfall_id TEXT,
      image_url TEXT,
      mana_cost TEXT,
      colors TEXT DEFAULT '[]',
      type_line TEXT,
      rarity TEXT,
      min_condition TEXT DEFAULT 'LP',
      foil INTEGER DEFAULT 2, -- 0: non-foil, 1: foil, 2: any
      language TEXT DEFAULT 'en',
      price_pln REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buylist_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      seller_name TEXT NOT NULL,
      seller_contact TEXT NOT NULL,
      meeting_day TEXT NOT NULL,
      notes TEXT,
      status TEXT DEFAULT 'pending', -- pending, accepted, completed, rejected
      total_payout_pln REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buylist_offer_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offer_id INTEGER NOT NULL REFERENCES buylist_offers(id) ON DELETE CASCADE,
      buylist_card_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      offered_price_pln REAL NOT NULL,
      card_name TEXT NOT NULL,
      set_code TEXT,
      collector_number TEXT,
      image_url TEXT,
      foil INTEGER DEFAULT 0,
      condition TEXT
    );

    CREATE TABLE IF NOT EXISTS mtgspot_buylist_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buylist_item_id INTEGER NOT NULL REFERENCES buylist_cards(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      card_name TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      condition TEXT,
      is_foil INTEGER NOT NULL DEFAULT 0,
      expansion TEXT,
      card_url TEXT,
      image_url TEXT,
      language TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      requires_verification INTEGER NOT NULL DEFAULT 0,
      verification_note TEXT,
      scraped_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(buylist_item_id, external_id)
    );

    CREATE INDEX IF NOT EXISTS idx_mtgspot_offers_buylist_id ON mtgspot_buylist_offers(buylist_item_id);
    CREATE INDEX IF NOT EXISTS idx_mtgspot_offers_available ON mtgspot_buylist_offers(is_available);
    CREATE INDEX IF NOT EXISTS idx_mtgspot_offers_price ON mtgspot_buylist_offers(price);

    CREATE TABLE IF NOT EXISTS mtgspot_sync_status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      status TEXT NOT NULL DEFAULT 'idle',
      last_success_at TEXT,
      last_attempt_at TEXT,
      last_items_processed INTEGER NOT NULL DEFAULT 0,
      last_offers_processed INTEGER NOT NULL DEFAULT 0,
      last_error TEXT
    );

    INSERT OR IGNORE INTO mtgspot_sync_status (id, status, last_items_processed, last_offers_processed)
    VALUES (1, 'idle', 0, 0);
  `);

  // Safe migration for existing databases: ensure `active` column exists on `buylist_cards`
  const buylistCols = db.prepare('PRAGMA table_info(buylist_cards)').all() as Array<{ name: string }>;
  if (!buylistCols.some((c) => c.name === 'active')) {
    db.exec('ALTER TABLE buylist_cards ADD COLUMN active INTEGER NOT NULL DEFAULT 1;');
  }

  // Safe migration for `mtgspot_buylist_offers` optional columns if upgrading from an older schema
  const offerCols = db.prepare('PRAGMA table_info(mtgspot_buylist_offers)').all() as Array<{ name: string }>;
  if (!offerCols.some((c) => c.name === 'requires_verification')) {
    db.exec('ALTER TABLE mtgspot_buylist_offers ADD COLUMN requires_verification INTEGER NOT NULL DEFAULT 0;');
  }
  if (!offerCols.some((c) => c.name === 'verification_note')) {
    db.exec('ALTER TABLE mtgspot_buylist_offers ADD COLUMN verification_note TEXT;');
  }
  if (!offerCols.some((c) => c.name === 'image_url')) {
    db.exec('ALTER TABLE mtgspot_buylist_offers ADD COLUMN image_url TEXT;');
  }
  if (!offerCols.some((c) => c.name === 'language')) {
    db.exec('ALTER TABLE mtgspot_buylist_offers ADD COLUMN language TEXT;');
  }

  // Seed sample buylist cards if empty
  const countBuylist = db.prepare('SELECT COUNT(*) as count FROM buylist_cards').get() as { count: number } | undefined;
  if (!countBuylist || countBuylist.count === 0) {
    const insertBuyStmt = db.prepare(`
      INSERT INTO buylist_cards (
        name, set_code, set_name, collector_number, scryfall_id, image_url,
        mana_cost, colors, type_line, rarity, min_condition, foil, language,
        price_pln, quantity, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertBuyStmt.run(
      'Orcish Bowmasters',
      'ltr',
      'The Lord of the Rings: Tales of Middle-earth',
      '103',
      '7c024bae-5631-4e20-ac69-df392ac9e109',
      'https://cards.scryfall.io/normal/front/7/c/7c024bae-5631-4e20-ac69-df392ac9e109.jpg',
      '{1}{B}',
      '["B"]',
      'Creature — Orc Archer',
      'rare',
      'LP',
      2, // any
      'en',
      135.00,
      2,
      'Chętnie wezmę 2 sztuki do talii!'
    );

    insertBuyStmt.run(
      'Sheoldred, the Apocalypse',
      'dmu',
      'Dominaria United',
      '107',
      'd67be074-cdd4-41d9-ac89-0a0456c4e4b2',
      'https://cards.scryfall.io/normal/front/d/6/d67be074-cdd4-41d9-ac89-0a0456c4e4b2.jpg',
      '{2}{B}{B}',
      '["B"]',
      'Legendary Creature — Phyrexian Praetor',
      'mythic',
      'NM',
      0, // non-foil
      'en',
      270.00,
      1,
      'Tylko stan NM lub LP+'
    );

    insertBuyStmt.run(
      'Flooded Strand',
      'mh3',
      'Modern Horizons 3',
      '220',
      '8f352136-1e6a-4632-a5e2-e1c50e20601f',
      'https://cards.scryfall.io/normal/front/8/f/8f352136-1e6a-4632-a5e2-e1c50e20601f.jpg',
      '',
      '[]',
      'Land',
      'rare',
      'LP',
      2, // any
      'en',
      45.00,
      4,
      'Potrzebny pełen playset 4 szt.'
    );
  }

  // Insert default settings if not exists
  const defaultSettings: Record<string, string> = {
    store_title: 'Karty MTG - Rezerwacje',
    store_subtitle: 'Wybierz karty i odbierz we wtorek lub czwartek!',
    pickup_days: 'Wtorek (turniej),Czwartek (commander)',
    discord_webhook: '',
    eur_to_pln: '4.30',
    admin_password: 'haslo',
    admin_pin: 'haslo',
  };

  const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSettingStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
  const updateSettingStmt = db.prepare('UPDATE settings SET value = ? WHERE key = ?');

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = getSettingStmt.get(key) as { value: string } | undefined;
    if (!existing) {
      insertSettingStmt.run(key, value);
    }
  }

  // If old default '1234' is still set in admin_pin or admin_password, migrate to 'haslo'
  const oldPin = getSettingStmt.get('admin_pin') as { value: string } | undefined;
  if (oldPin?.value === '1234') {
    updateSettingStmt.run('haslo', 'admin_pin');
  }
  const oldPass = getSettingStmt.get('admin_password') as { value: string } | undefined;
  if (oldPass?.value === '1234') {
    updateSettingStmt.run('haslo', 'admin_password');
  }

  dbInstance = db;
  return db;
}
