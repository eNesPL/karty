'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, BuylistCard, PublicSettings, CardFiltersMeta } from '@/lib/types';
import { CardItem } from '@/components/CardItem';
import { BuylistCardItem } from '@/components/BuylistCardItem';
import { CardModal } from '@/components/CardModal';
import { CartDrawer, CartItem as CartItemType } from '@/components/CartDrawer';
import { BuylistOfferDrawer, BuylistOfferItemState } from '@/components/BuylistOfferDrawer';
import {
  Search,
  ShoppingBag,
  Sparkles,
  SlidersHorizontal,
  X,
  RefreshCw,
  HandCoins,
  Store,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers,
  CircleDollarSign,
  Tag,
  Check,
} from 'lucide-react';
import Link from 'next/link';

const COLOR_FILTERS = [
  { id: '', label: 'Wszystkie' },
  { id: 'W', label: 'Biały {W}', dot: 'bg-amber-100 border-amber-300' },
  { id: 'U', label: 'Niebieski {U}', dot: 'bg-blue-500 border-blue-400' },
  { id: 'B', label: 'Czarny {B}', dot: 'bg-slate-700 border-slate-500' },
  { id: 'R', label: 'Czerwony {R}', dot: 'bg-red-500 border-red-400' },
  { id: 'G', label: 'Zielony {G}', dot: 'bg-emerald-500 border-emerald-400' },
  { id: 'M', label: 'Multi', dot: 'bg-gradient-to-r from-amber-400 to-yellow-600 border-amber-300' },
  { id: 'C', label: 'Bezbarwny', dot: 'bg-slate-500 border-slate-400' },
];

const CARD_TYPES = [
  { id: '', label: 'Wszystkie typy' },
  { id: 'creature', label: 'Stwory (Creature)' },
  { id: 'instant', label: 'Instanty' },
  { id: 'sorcery', label: 'Czary (Sorcery)' },
  { id: 'enchantment', label: 'Zauroczenia (Enchantment)' },
  { id: 'artifact', label: 'Artefakty' },
  { id: 'planeswalker', label: 'Planeswalkerzy' },
  { id: 'land', label: 'Lądy (Land)' },
  { id: 'battle', label: 'Bitwy (Battle)' },
];

const RARITY_OPTIONS = [
  { id: '', label: 'Wszystkie' },
  { id: 'mythic', label: 'Mityczna (Mythic)', dotColor: 'bg-orange-500' },
  { id: 'rare', label: 'Rzadka (Rare)', dotColor: 'bg-amber-400' },
  { id: 'uncommon', label: 'Niezwykła (Uncommon)', dotColor: 'bg-slate-300' },
  { id: 'common', label: 'Zwykła (Common)', dotColor: 'bg-slate-500' },
];

const CONDITION_OPTIONS = [
  { id: '', label: 'Wszystkie stany' },
  { id: 'Near Mint', label: 'Near Mint (NM)' },
  { id: 'LP/EX', label: 'Lightly Played (LP/EX)' },
  { id: 'MP', label: 'Moderately Played (MP)' },
  { id: 'HP', label: 'Heavily Played (HP)' },
  { id: 'DMG', label: 'Damaged (DMG)' },
];

const PRICE_PRESETS = [
  { id: 'under_10', label: '< 10 zł', min: '', max: '10' },
  { id: '10_50', label: '10 - 50 zł', min: '10', max: '50' },
  { id: '50_100', label: '50 - 100 zł', min: '50', max: '100' },
  { id: 'over_100', label: '> 100 zł', min: '100', max: '' },
];

export default function CatalogPage() {
  const [activeTab, setActiveTab] = useState<'sell' | 'buylist'>('sell');

  // Sell Catalog State
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState<CardFiltersMeta | null>(null);

  // Buylist State
  const [buylistCards, setBuylistCards] = useState<BuylistCard[]>([]);
  const [buylistLoading, setBuylistLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [selectedSet, setSelectedSet] = useState('');
  const [selectedCondition, setSelectedCondition] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [foilFilter, setFoilFilter] = useState<'all' | 'foil' | 'non_foil'>('all');
  const [inStockOnly, setInStockOnly] = useState(true);
  const [sortBy, setSortBy] = useState<'price_desc' | 'price_asc' | 'name_asc' | 'name_desc' | 'rarity_desc' | 'newest'>('price_desc');

  // Advanced Filters Panel
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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
  const fetchSettings = useCallback(() => {
    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.pickup_days)) {
          setSettings(data);
        }
      })
      .catch((err) => console.error('Error fetching settings:', err));
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (isCartOpen || isBuylistOfferOpen) {
      fetchSettings();
    }
  }, [isCartOpen, isBuylistOfferOpen, fetchSettings]);

  // Fetch cards (Sell inventory)
  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedColor) params.set('color', selectedColor);
      if (selectedType) params.set('type', selectedType);
      if (selectedRarity) params.set('rarity', selectedRarity);
      if (selectedSet) params.set('set', selectedSet);
      if (selectedCondition) params.set('condition', selectedCondition);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);

      if (foilFilter === 'foil') params.set('foil', 'true');
      else if (foilFilter === 'non_foil') params.set('foil', 'false');

      if (!inStockOnly) params.set('in_stock', 'false');
      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/cards?${params.toString()}`);
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
      }
      if (data.meta) {
        setMeta(data.meta);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    selectedColor,
    selectedType,
    selectedRarity,
    selectedSet,
    selectedCondition,
    minPrice,
    maxPrice,
    foilFilter,
    inStockOnly,
    sortBy,
  ]);

  // Fetch Buylist cards
  const fetchBuylistCards = useCallback(async () => {
    setBuylistLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (selectedColor) params.set('color', selectedColor);
      if (selectedType) params.set('type', selectedType);
      if (selectedRarity) params.set('rarity', selectedRarity);
      if (selectedSet) params.set('set', selectedSet);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);

      if (foilFilter === 'foil') params.set('foil', 'true');
      else if (foilFilter === 'non_foil') params.set('foil', 'false');

      if (sortBy) params.set('sort', sortBy);

      const res = await fetch(`/api/buylist?${params.toString()}`);
      const data = await res.json();
      if (data.cards) {
        setBuylistCards(data.cards);
      }
    } catch (err) {
      console.error('Error fetching buylist cards:', err);
    } finally {
      setBuylistLoading(false);
    }
  }, [
    searchQuery,
    selectedColor,
    selectedType,
    selectedRarity,
    selectedSet,
    minPrice,
    maxPrice,
    foilFilter,
    sortBy,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'sell') {
        fetchCards();
      } else {
        fetchBuylistCards();
      }
    }, 200);
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

  // Buylist Offer handlers (Buy mode)
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
          condition: card.min_condition === 'ANY' ? 'NM' : card.min_condition,
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

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSelectedColor('');
    setSelectedType('');
    setSelectedRarity('');
    setSelectedSet('');
    setSelectedCondition('');
    setMinPrice('');
    setMaxPrice('');
    setFoilFilter('all');
    setInStockOnly(true);
    setSortBy('price_desc');
  };

  const handlePricePreset = (presetMin: string, presetMax: string) => {
    if (minPrice === presetMin && maxPrice === presetMax) {
      setMinPrice('');
      setMaxPrice('');
    } else {
      setMinPrice(presetMin);
      setMaxPrice(presetMax);
    }
  };

  // Active filters count
  const activeFiltersCount = [
    searchQuery.trim() !== '',
    selectedColor !== '',
    selectedType !== '',
    selectedRarity !== '',
    selectedSet !== '',
    foilFilter !== 'all',
    selectedCondition !== '',
    minPrice !== '' || maxPrice !== '',
    !inStockOnly,
  ].filter(Boolean).length;

  // Totals
  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.card.price_pln * item.quantity, 0);

  const totalOfferCount = buylistOffer.reduce((sum, item) => sum + item.quantity, 0);
  const totalOfferPayout = buylistOffer.reduce((sum, item) => sum + item.card.price_pln * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 font-black text-slate-950 text-xs shadow-sm shadow-amber-500/30">
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

        {/* Tab Switcher: Sprzedam (Klaser) vs Kupię (Skup) */}
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
              <span>Kupię (Lista Skupu)</span>
              {totalOfferCount > 0 && (
                <span className="rounded-full bg-slate-950/20 px-1.5 py-0.2 text-[10px]">
                  {totalOfferCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Quick Filters Bar */}
        <div className="mx-auto max-w-6xl px-4 pb-3 sm:px-6 space-y-2.5">
          {/* Row 1: Search Input */}
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'sell'
                  ? 'Szukaj karty w klaserze (np. Ragavan, Counterspell, Modern...)'
                  : 'Szukaj na liście poszukiwanych kart do skupu...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/90 py-2 pr-9 pl-9 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-2.5 right-3 text-slate-400 hover:text-white"
                title="Wyczyść szukanie"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Row 2: Color Pills, Advanced Filters Toggle, Sort */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {/* Color buttons */}
            <div className="flex items-center gap-1">
              {COLOR_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedColor(f.id)}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 font-medium transition ${
                    selectedColor === f.id
                      ? activeTab === 'sell'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {f.dot && (
                    <span
                      className={`inline-block h-2 w-2 rounded-full border ${f.dot}`}
                    />
                  )}
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Foil Button */}
            <button
              onClick={() =>
                setFoilFilter((prev) => (prev === 'foil' ? 'all' : 'foil'))
              }
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-1 font-medium transition ${
                foilFilter === 'foil'
                  ? 'border border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3 w-3 text-amber-400" />
              Foil
            </button>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1 font-semibold transition ${
                isFilterPanelOpen || activeFiltersCount > 0
                  ? activeTab === 'sell'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-sky-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Filtry</span>
              {activeFiltersCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 text-[10px] font-black text-amber-400">
                  {activeFiltersCount}
                </span>
              )}
              {isFilterPanelOpen ? (
                <ChevronUp className="h-3 w-3 opacity-80" />
              ) : (
                <ChevronDown className="h-3 w-3 opacity-80" />
              )}
            </button>

            {/* Sort selector */}
            <div className="ml-auto flex items-center gap-1 pl-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-300 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                <option value="price_desc">Cena: najwyższa</option>
                <option value="price_asc">Cena: najniższa</option>
                <option value="name_asc">Nazwa A-Z</option>
                <option value="name_desc">Nazwa Z-A</option>
                <option value="rarity_desc">Rzadkość (od Mitycznych)</option>
                <option value="newest">Najnowsze</option>
              </select>
            </div>
          </div>

          {/* Row 3: Expandable Advanced Filters Panel */}
          {isFilterPanelOpen && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. Typ Karty */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Layers className="h-3.5 w-3.5 text-amber-400" />
                    Typ karty
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {CARD_TYPES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedType(t.id)}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                          selectedType === t.id
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Rzadkość (Rarity) */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Tag className="h-3.5 w-3.5 text-amber-400" />
                    Rzadkość (Rarity)
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {RARITY_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedRarity(r.id)}
                        className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                          selectedRarity === r.id
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {r.dotColor && (
                          <span className={`h-2 w-2 rounded-full ${r.dotColor}`} />
                        )}
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Dodatek (Set) */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Tag className="h-3.5 w-3.5 text-amber-400" />
                    Dodatek (Set)
                  </label>
                  <select
                    value={selectedSet}
                    onChange={(e) => setSelectedSet(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="">Wszystkie dodatki ({meta?.sets.length || 0})</option>
                    {meta?.sets.map((s) => (
                      <option key={s.set_code} value={s.set_code}>
                        {s.set_name} ({s.set_code.toUpperCase()}) • {s.count} szt.
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Zakres Cenowy */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <CircleDollarSign className="h-3.5 w-3.5 text-amber-400" />
                    Zakres cenowy (PLN)
                  </label>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1">
                      {PRICE_PRESETS.map((p) => {
                        const isSelected = minPrice === p.min && maxPrice === p.max;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handlePricePreset(p.min, p.max)}
                            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                              isSelected
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <input
                        type="number"
                        placeholder="Od (zł)"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200 placeholder-slate-600 focus:border-amber-500 focus:outline-none text-xs"
                      />
                      <span className="text-slate-500">—</span>
                      <input
                        type="number"
                        placeholder="Do (zł)"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-slate-200 placeholder-slate-600 focus:border-amber-500 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Wykończenie & Stan */}
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    Wykończenie i Stan
                  </label>
                  <div className="space-y-2">
                    <div className="flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-xs">
                      <button
                        onClick={() => setFoilFilter('all')}
                        className={`flex-1 rounded-md py-1 text-[11px] font-medium transition ${
                          foilFilter === 'all'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Wszystkie
                      </button>
                      <button
                        onClick={() => setFoilFilter('foil')}
                        className={`flex-1 flex items-center justify-center gap-1 rounded-md py-1 text-[11px] font-medium transition ${
                          foilFilter === 'foil'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className="h-3 w-3" /> Foil
                      </button>
                      <button
                        onClick={() => setFoilFilter('non_foil')}
                        className={`flex-1 rounded-md py-1 text-[11px] font-medium transition ${
                          foilFilter === 'non_foil'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Zwykłe
                      </button>
                    </div>

                    {activeTab === 'sell' && (
                      <select
                        value={selectedCondition}
                        onChange={(e) => setSelectedCondition(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-none cursor-pointer"
                      >
                        {CONDITION_OPTIONS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* 6. Dostępność & Akcje */}
                <div className="flex flex-col justify-between">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                      <Check className="h-3.5 w-3.5 text-amber-400" />
                      Dostępność magazynowa
                    </label>
                    {activeTab === 'sell' ? (
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer rounded-lg border border-slate-800 bg-slate-950 p-2 hover:border-slate-700 transition">
                        <input
                          type="checkbox"
                          checked={inStockOnly}
                          onChange={(e) => setInStockOnly(e.target.checked)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-900"
                        />
                        <span>Tylko karty na stanie (ilość &gt; 0)</span>
                      </label>
                    ) : (
                      <p className="text-xs text-slate-500 p-2">
                        Wyświetlane są karty aktualnie poszukiwane w skupie.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={handleClearAllFilters}
                      type="button"
                      className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 hover:border-slate-700 transition"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Wyczyść filtry
                    </button>
                    <button
                      onClick={() => setIsFilterPanelOpen(false)}
                      type="button"
                      className="ml-auto rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                    >
                      Zwiń filtry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Active Filter Chips Bar */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Aktywne:</span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Szukaj: &ldquo;{searchQuery}&rdquo;
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedColor && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Kolor: {COLOR_FILTERS.find((c) => c.id === selectedColor)?.label}
                  <button onClick={() => setSelectedColor('')} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedType && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Typ: {CARD_TYPES.find((t) => t.id === selectedType)?.label}
                  <button onClick={() => setSelectedType('')} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedRarity && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Rzadkość: {RARITY_OPTIONS.find((r) => r.id === selectedRarity)?.label}
                  <button onClick={() => setSelectedRarity('')} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedSet && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Dodatek: {meta?.sets.find((s) => s.set_code === selectedSet)?.set_name || selectedSet.toUpperCase()}
                  <button onClick={() => setSelectedSet('')} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Cena: {minPrice ? `od ${minPrice} zł` : ''} {maxPrice ? `do ${maxPrice} zł` : ''}
                  <button
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                    }}
                    className="text-slate-400 hover:text-amber-400"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {foilFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  {foilFilter === 'foil' ? '✨ Tylko Foil' : 'Tylko Non-foil'}
                  <button onClick={() => setFoilFilter('all')} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedCondition && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Stan: {selectedCondition}
                  <button onClick={() => setSelectedCondition('')} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {!inStockOnly && activeTab === 'sell' && (
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-[11px] text-slate-200">
                  Wszystkie (także wyprzedane)
                  <button onClick={() => setInStockOnly(true)} className="text-slate-400 hover:text-amber-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearAllFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline ml-1 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Wyczyść filtry ({activeFiltersCount})
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex-1 max-w-6xl w-full px-4 py-5 sm:px-6">
        {/* Results Counter Bar */}
        <div className="mb-4 flex items-center justify-between text-xs text-slate-400">
          <div>
            Znaleziono:{' '}
            <strong className="text-slate-100">
              {activeTab === 'sell' ? cards.length : buylistCards.length}
            </strong>{' '}
            {(activeTab === 'sell' ? cards.length : buylistCards.length) === 1
              ? 'kartę'
              : (activeTab === 'sell' ? cards.length : buylistCards.length) < 5
              ? 'karty'
              : 'kart'}
            {activeTab === 'sell' && meta?.totalCards && meta.totalCards !== cards.length ? (
              <span className="text-slate-500"> (z {meta.totalCards} w katalogu)</span>
            ) : null}
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-slate-400 hover:text-amber-400 transition cursor-pointer"
            >
              Resetuj filtry
            </button>
          )}
        </div>

        {/* Tab 1: Sell / Klaser Catalog */}
        {activeTab === 'sell' && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-amber-500" />
              <p className="mt-3 text-xs">Filtrowanie kart...</p>
            </div>
          ) : cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-16 text-center">
              <div className="rounded-full bg-slate-900 p-4 text-slate-500">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-300">
                Brak kart spełniających wybrane kryteria
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Spróbuj zmienić filtry, usunąć ograniczenia lub sprawdzić inną frazę.
              </p>
              {activeFiltersCount > 0 ? (
                <button
                  onClick={handleClearAllFilters}
                  className="mt-4 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
                >
                  Wyczyść wszystkie filtry
                </button>
              ) : (
                <Link
                  href="/admin"
                  className="mt-4 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700"
                >
                  Przejdź do panelu admina
                </Link>
              )}
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

        {/* Tab 2: Buylist / Kupię */}
        {activeTab === 'buylist' && (
          buylistLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-sky-500" />
              <p className="mt-3 text-xs">Ładowanie listy skupu...</p>
            </div>
          ) : buylistCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sky-950 py-16 text-center">
              <div className="rounded-full bg-sky-950/50 p-4 text-sky-400">
                <HandCoins className="h-8 w-8" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-slate-300">
                Brak kart na liście skupu
              </h3>
              <p className="mt-1 text-xs text-slate-500 max-w-xs">
                Aktualnie lista skupu jest pusta lub żadna karta nie pasuje do filtrów.
              </p>
              {activeFiltersCount > 0 ? (
                <button
                  onClick={handleClearAllFilters}
                  className="mt-4 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
                >
                  Wyczyść filtry skupu
                </button>
              ) : (
                <Link
                  href="/admin"
                  className="mt-4 rounded-lg bg-sky-900/60 border border-sky-700/60 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-800/80"
                >
                  Zarządzaj skupem w panelu admina
                </Link>
              )}
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
          MTG Klaser &amp; Skup • Zeskanuj QR, zarezerwuj karty lub zaoferuj karty do skupu
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
