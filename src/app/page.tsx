'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, BuylistCard, PublicSettings } from '@/lib/types';
import { CardItem } from '@/components/CardItem';
import { BuylistCardItem } from '@/components/BuylistCardItem';
import { CardModal } from '@/components/CardModal';
import { CartDrawer, CartItem as CartItemType } from '@/components/CartDrawer';
import { BuylistOfferDrawer, BuylistOfferItemState } from '@/components/BuylistOfferDrawer';
import {
  Search,
  ShoppingBag,
  Sparkles,
  X,
  RefreshCw,
  HandCoins,
  Store,
  Layers,
} from 'lucide-react';
import Link from 'next/link';

const COLOR_FILTERS = [
  { id: '', label: 'Wszystkie' },
  { id: 'W', label: 'Biały {W}', color: 'bg-amber-100 text-amber-950' },
  { id: 'U', label: 'Niebieski {U}', color: 'bg-blue-600 text-white' },
  { id: 'B', label: 'Czarny {B}', color: 'bg-slate-800 text-slate-200' },
  { id: 'R', label: 'Czerwony {R}', color: 'bg-red-600 text-white' },
  { id: 'G', label: 'Zielony {G}', color: 'bg-emerald-600 text-white' },
  { id: 'M', label: 'Multi', color: 'bg-gradient-to-r from-amber-400 to-yellow-600 text-slate-950' },
  { id: 'C', label: 'Bezbarwny', color: 'bg-slate-700 text-slate-300' },
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<'sell' | 'buylist'>('sell');

  // Sell Catalog State
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // Buylist State
  const [buylistCards, setBuylistCards] = useState<BuylistCard[]>([]);
  const [buylistLoading, setBuylistLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [onlyFoil, setOnlyFoil] = useState(false);
  const [sortBy, setSortBy] = useState<'price_desc' | 'price_asc' | 'name'>('price_desc');

  // Store Settings
  const [settings, setSettings] = useState<PublicSettings>({
    store_title: 'Karty MTG - Rezerwacje',
    store_subtitle: 'Wybierz karty i odbierz we wtorek lub czwartek!',
    pickup_days: ['Wtorek (turniej)', 'Czwartek (commander)'],
  });

  // Sell Cart state
  const [cart, setCart] = useState<CartItemType[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Buylist Offer state
  const [buylistOffer, setBuylistOffer] = useState<BuylistOfferItemState[]>([]);
  const [isBuylistOfferOpen, setIsBuylistOfferOpen] = useState(false);

  // Preview Modal
  const [previewCard, setPreviewCard] = useState<Card | BuylistCard | null>(null);

  // Fetch settings
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.store_title) setSettings(data);
      })
      .catch((err) => console.error('Error fetching settings:', err));
  }, []);

  // Fetch cards (Sell inventory)
  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedColor) params.set('color', selectedColor);
      if (onlyFoil) params.set('foil', 'true');

      const res = await fetch(`/api/cards?${params.toString()}`);
      const data = await res.json();
      if (data.cards) {
        let sorted = [...data.cards];
        if (sortBy === 'price_desc') {
          sorted.sort((a, b) => b.price_pln - a.price_pln);
        } else if (sortBy === 'price_asc') {
          sorted.sort((a, b) => a.price_pln - b.price_pln);
        } else if (sortBy === 'name') {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        }
        setCards(sorted);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedColor, onlyFoil, sortBy]);

  // Fetch Buylist cards
  const fetchBuylistCards = useCallback(async () => {
    setBuylistLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (selectedColor) params.set('color', selectedColor);
      if (onlyFoil) params.set('foil', 'true');

      const res = await fetch(`/api/buylist?${params.toString()}`);
      const data = await res.json();
      if (data.cards) {
        let sorted = [...data.cards];
        if (sortBy === 'price_desc') {
          sorted.sort((a, b) => b.price_pln - a.price_pln);
        } else if (sortBy === 'price_asc') {
          sorted.sort((a, b) => a.price_pln - b.price_pln);
        } else if (sortBy === 'name') {
          sorted.sort((a, b) => a.name.localeCompare(b.name));
        }
        setBuylistCards(sorted);
      }
    } catch (err) {
      console.error('Error fetching buylist cards:', err);
    } finally {
      setBuylistLoading(false);
    }
  }, [searchQuery, selectedColor, onlyFoil, sortBy]);

  // Trigger search on debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'sell') {
        fetchCards();
      } else {
        fetchBuylistCards();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [activeTab, fetchCards, fetchBuylistCards]);

  // Cart handlers (Sell mode)
  const handleAddToCart = (card: Card) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.card.id === card.id);
      if (existing) {
        if (existing.quantity >= card.quantity) return prev;
        return prev.map((i) =>
          i.card.id === card.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { card, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (cardId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(cardId);
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.card.id === cardId ? { ...i, quantity: qty } : i))
    );
  };

  const handleRemoveItem = (cardId: number) => {
    setCart((prev) => prev.filter((i) => i.card.id !== cardId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Buylist Offer handlers
  const handleAddToOffer = (card: BuylistCard) => {
    setBuylistOffer((prev) => {
      const existing = prev.find((i) => i.card.id === card.id);
      if (existing) {
        if (existing.quantity >= card.quantity) return prev;
        return prev.map((i) =>
          i.card.id === card.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          card,
          quantity: 1,
          condition: card.min_condition || 'NM',
          foil: card.foil === 1 ? 1 : 0,
        },
      ];
    });
  };

  const handleUpdateOfferQuantity = (cardId: number, qty: number) => {
    if (qty <= 0) {
      handleRemoveOfferItem(cardId);
      return;
    }
    setBuylistOffer((prev) =>
      prev.map((i) => (i.card.id === cardId ? { ...i, quantity: qty } : i))
    );
  };

  const handleUpdateOfferCondition = (cardId: number, condition: string) => {
    setBuylistOffer((prev) =>
      prev.map((i) => (i.card.id === cardId ? { ...i, condition } : i))
    );
  };

  const handleUpdateOfferFoil = (cardId: number, foil: number) => {
    setBuylistOffer((prev) =>
      prev.map((i) => (i.card.id === cardId ? { ...i, foil } : i))
    );
  };

  const handleRemoveOfferItem = (cardId: number) => {
    setBuylistOffer((prev) => prev.filter((i) => i.card.id !== cardId));
  };

  const handleClearOffer = () => {
    setBuylistOffer([]);
  };

  // Totals
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.card.price_pln * item.quantity, 0);

  const totalOfferCount = buylistOffer.reduce((sum, item) => sum + item.quantity, 0);
  const totalOfferPayout = buylistOffer.reduce((sum, item) => sum + item.card.price_pln * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 font-black text-slate-950 text-xs">
                M
              </span>
              <h1 className="text-base font-bold text-white tracking-tight sm:text-lg">
                {settings.store_title}
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {settings.store_subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sell Cart Button */}
            {activeTab === 'sell' ? (
              <button
                onClick={() => setIsCartOpen(true)}
                type="button"
                className="relative flex items-center gap-2 rounded-xl bg-amber-500 px-3.5 py-2 font-bold text-slate-950 shadow-md transition hover:bg-amber-400 active:scale-95"
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Koszyk</span>
                {totalCartCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-amber-400">
                    {totalCartCount}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setIsBuylistOfferOpen(true)}
                type="button"
                className="relative flex items-center gap-2 rounded-xl bg-sky-600 px-3.5 py-2 font-bold text-white shadow-md transition hover:bg-sky-500 active:scale-95"
              >
                <HandCoins className="h-4 w-4" />
                <span className="text-xs sm:text-sm">Twoja oferta</span>
                {totalOfferCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-sky-300">
                    {totalOfferCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher: Sprzedam vs Kupię */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-1 pb-2">
          <div className="grid grid-cols-2 rounded-xl bg-slate-900/90 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('sell')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'sell'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Store className="h-4 w-4" />
              <span>Sprzedam (Klaser)</span>
              {totalCartCount > 0 && (
                <span className="rounded-full bg-slate-950/20 px-1.5 py-0.2 text-[10px]">
                  {totalCartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('buylist')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'buylist'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HandCoins className="h-4 w-4" />
              <span>Chcę kupić (Skup)</span>
              {totalOfferCount > 0 && (
                <span className="rounded-full bg-slate-950/20 px-1.5 py-0.2 text-[10px]">
                  {totalOfferCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6 space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'sell'
                  ? 'Szukaj karty do zakupu (np. Ragavan, Sol Ring, Modern...)'
                  : 'Szukaj karty, którą skupuję (np. Bowmasters, Fetchland...)'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pr-9 pl-9 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-2.5 right-3 text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {COLOR_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedColor(f.id)}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 font-medium transition ${
                  selectedColor === f.id
                    ? activeTab === 'sell'
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={() => setOnlyFoil(!onlyFoil)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 font-medium transition ${
                onlyFoil
                  ? activeTab === 'sell'
                    ? 'border border-amber-400 bg-amber-500/20 text-amber-300 font-bold'
                    : 'border border-sky-400 bg-sky-500/20 text-sky-300 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Tylko Foil
            </button>

            <div className="ml-auto flex items-center gap-1 pl-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="price_desc">Cena: najwyższa</option>
                <option value="price_asc">Cena: najniższa</option>
                <option value="name">Nazwa A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex-1 max-w-6xl w-full px-4 py-5 sm:px-6">
        {/* Buylist Explanatory Notice */}
        {activeTab === 'buylist' && (
          <div className="mb-4 rounded-xl border border-sky-800/60 bg-sky-950/30 p-3.5 text-xs text-sky-200 flex items-start gap-3">
            <div className="rounded-lg bg-sky-500/20 p-2 text-sky-300 flex-shrink-0">
              <HandCoins className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Szukam poniższych kart (Skup MTG)</h4>
              <p className="mt-0.5 text-slate-300">
                Chętnie odkupię od Ciebie te karty na najbliższym turnieju za podane kwoty w PLN. Jeśli masz którąś z nich, kliknij <strong className="text-sky-300">„Mam tę kartę”</strong> i prześlij formularz!
              </p>
            </div>
          </div>
        )}

        {/* Content for Sell Mode */}
        {activeTab === 'sell' && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
              <p className="mt-3 text-xs">Ładowanie kart na sprzedaż...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
              <div className="rounded-full bg-slate-900 p-4 text-slate-500">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-300">Brak kart spełniających kryteria</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Spróbuj zmienić filtry lub wyszukiwaną frazę. Jeśli jesteś administratorem, wgraj plik CSV w panelu.
              </p>
              <Link
                href="/admin"
                className="mt-4 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
              >
                Przejdź do panelu admina
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {cards.map((card) => {
                const inCart = cart.find((i) => i.card.id === card.id)?.quantity || 0;
                return (
                  <CardItem
                    key={card.id}
                    card={card}
                    cartQuantity={inCart}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={(id) => handleUpdateQuantity(id, inCart - 1)}
                    onPreview={(c) => setPreviewCard(c)}
                  />
                );
              })}
            </div>
          )
        )}

        {/* Content for Buylist Mode */}
        {activeTab === 'buylist' && (
          buylistLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-sky-400" />
              <p className="mt-3 text-xs">Ładowanie poszukiwanych kart...</p>
            </div>
          ) : buylistCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
              <div className="rounded-full bg-slate-900 p-4 text-slate-500">
                <HandCoins className="h-8 w-8 text-sky-400" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-300">Brak poszukiwanych kart</h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Aktualnie lista skupu jest pusta lub żadna karta nie pasuje do filtrów. Dodaj karty do skupu w panelu admina!
              </p>
              <Link
                href="/admin"
                className="mt-4 rounded-lg bg-sky-900/60 border border-sky-700/60 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-800/80"
              >
                Zarządzaj skupem w panelu admina
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {buylistCards.map((bCard) => {
                const inOffer = buylistOffer.find((i) => i.card.id === bCard.id)?.quantity || 0;
                return (
                  <BuylistCardItem
                    key={bCard.id}
                    card={bCard}
                    offerQuantity={inOffer}
                    onAddToOffer={handleAddToOffer}
                    onRemoveFromOffer={(id) => handleUpdateOfferQuantity(id, inOffer - 1)}
                    onPreview={(c) => setPreviewCard(c)}
                  />
                );
              })}
            </div>
          )
        )}
      </main>

      {/* Floating Bottom Cart Bar (Sell mode) */}
      {activeTab === 'sell' && totalCartCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setIsCartOpen(true)}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-3.5 font-bold text-slate-950 shadow-xl shadow-amber-500/25 active:scale-95"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-amber-400">
                {totalCartCount}
              </span>
              <span className="text-sm">Zarezerwuj karty</span>
            </div>
            <span className="text-base font-extrabold">{totalCartPrice.toFixed(2)} PLN →</span>
          </button>
        </div>
      )}

      {/* Floating Bottom Offer Bar (Buylist mode) */}
      {activeTab === 'buylist' && totalOfferCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md animate-in slide-in-from-bottom duration-200">
          <button
            onClick={() => setIsBuylistOfferOpen(true)}
            type="button"
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3.5 font-bold text-white shadow-xl shadow-sky-500/25 active:scale-95"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-sky-300">
                {totalOfferCount}
              </span>
              <span className="text-sm">Wyślij ofertę sprzedaży</span>
            </div>
            <span className="text-base font-extrabold">{totalOfferPayout.toFixed(2)} PLN →</span>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-6 text-center text-xs text-slate-600">
        <p>
          MTG Klaser & Skup • Zeskanuj QR, zarezerwuj karty lub zaoferuj karty do skupu
        </p>
        <div className="mt-2 flex items-center justify-center gap-4 text-slate-500">
          <Link href="/admin" className="hover:text-amber-400 transition">
            Panel Zarządzania (Admin)
          </Link>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CardModal
        card={previewCard}
        mode={activeTab === 'sell' ? 'sell' : 'buy'}
        onClose={() => setPreviewCard(null)}
        onAddToCart={(c) => handleAddToCart(c)}
        onAddToOffer={(c) => handleAddToOffer(c)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        pickupDays={settings.pickup_days}
        onReservationSuccess={() => fetchCards()}
      />

      <BuylistOfferDrawer
        isOpen={isBuylistOfferOpen}
        onClose={() => setIsBuylistOfferOpen(false)}
        items={buylistOffer}
        onUpdateQuantity={handleUpdateOfferQuantity}
        onUpdateCondition={handleUpdateOfferCondition}
        onUpdateFoil={handleUpdateOfferFoil}
        onRemoveItem={handleRemoveOfferItem}
        onClearOffer={handleClearOffer}
        pickupDays={settings.pickup_days}
        onOfferSuccess={() => fetchBuylistCards()}
      />
    </div>
  );
}
