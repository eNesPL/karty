import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

let dbInstance: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'karty.db');
  const db = new DatabaseSync(dbPath);

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
  `);

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
    admin_pin: '1234',
  };

  const getSettingStmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const insertSettingStmt = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = getSettingStmt.get(key) as { value: string } | undefined;
    if (!existing) {
      insertSettingStmt.run(key, value);
    }
  }

  dbInstance = db;
  return db;
}
