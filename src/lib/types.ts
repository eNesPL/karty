export interface Card {
  id: number;
  name: string;
  set_code: string | null;
  set_name: string | null;
  collector_number: string | null;
  scryfall_id: string | null;
  image_url: string | null;
  mana_cost: string | null;
  colors: string; // JSON array string e.g. '["W"]'
  type_line: string | null;
  rarity: string | null;
  condition: string;
  foil: number; // 0 or 1
  language: string;
  price_pln: number;
  price_eur: number | null;
  quantity: number;
  created_at?: string;
}

export interface ReservationItem {
  id?: number;
  reservation_id?: number;
  card_id: number;
  quantity: number;
  price_pln: number;
  card_name: string;
  set_code?: string | null;
  collector_number?: string | null;
  image_url?: string | null;
  foil: number;
  condition: string;
}

export interface Reservation {
  id: number;
  buyer_name: string;
  buyer_contact: string;
  pickup_day: string;
  notes?: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  total_price_pln: number;
  created_at: string;
  items?: ReservationItem[];
}

export interface Settings {
  store_title: string;
  store_subtitle: string;
  pickup_days: string;
  discord_webhook: string;
  eur_to_pln: string;
  admin_password?: string;
  admin_pin?: string;
}

export interface PublicSettings {
  store_title: string;
  store_subtitle: string;
  pickup_days: string[];
}

export interface BuylistCard {
  id: number;
  name: string;
  set_code: string | null;
  set_name: string | null;
  collector_number: string | null;
  scryfall_id: string | null;
  image_url: string | null;
  mana_cost: string | null;
  colors: string; // JSON array string e.g. '["W"]'
  type_line: string | null;
  rarity: string | null;
  min_condition: string; // NM, LP, MP, ANY
  foil: number; // 0 = Non-foil only, 1 = Foil only, 2 = Any (obojętne)
  language: string;
  price_pln: number; // cena skupu oferowana przez właściciela
  quantity: number; // poszukiwana ilość
  notes?: string | null;
  created_at?: string;
}

export interface BuylistOfferItem {
  id?: number;
  offer_id?: number;
  buylist_card_id: number;
  quantity: number;
  offered_price_pln: number;
  card_name: string;
  set_code?: string | null;
  collector_number?: string | null;
  image_url?: string | null;
  foil: number;
  condition: string;
}

export interface BuylistOffer {
  id: number;
  seller_name: string;
  seller_contact: string;
  meeting_day: string;
  notes?: string | null;
  status: 'pending' | 'accepted' | 'completed' | 'rejected';
  total_payout_pln: number;
  created_at: string;
  items?: BuylistOfferItem[];
}

export interface FilterMetaSet {
  set_code: string;
  set_name: string;
  count: number;
}

export interface CardFiltersMeta {
  sets: FilterMetaSet[];
  rarities: { rarity: string; count: number }[];
  minPrice: number;
  maxPrice: number;
  totalCards: number;
}

