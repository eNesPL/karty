'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Lock,
  Package,
  Layers,
  Upload,
  Settings as SettingsIcon,
  QrCode,
  CheckCircle,
  XCircle,
  Trash2,
  Edit2,
  Plus,
  Search,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Send,
  Printer,
  Download,
  AlertCircle,
  FileSpreadsheet,
  HandCoins,
  RotateCcw,
} from 'lucide-react';
import { Card, Reservation, BuylistCard, BuylistOffer } from '@/lib/types';
import { BuylistBulkPreviewItem } from '@/lib/buylist_bulk';
import Link from 'next/link';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuth, setIsAuth] = useState(false);
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState<'reservations' | 'inventory' | 'buylist' | 'buylist_offers' | 'import' | 'settings'>('reservations');

  // Reservations state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resFilter, setResFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('pending');
  const [resLoading, setResLoading] = useState(false);

  // Buylist state
  const [buylistCards, setBuylistCards] = useState<BuylistCard[]>([]);
  const [buylistSearch, setBuylistSearch] = useState('');
  const [buylistLoading, setBuylistLoading] = useState(false);
  const [editingBuylistCard, setEditingBuylistCard] = useState<BuylistCard | null>(null);

  // Buylist Offers state
  const [buylistOffers, setBuylistOffers] = useState<BuylistOffer[]>([]);
  const [offerFilter, setOfferFilter] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'rejected'>('pending');
  const [offersLoading, setOffersLoading] = useState(false);

  // Add Card to Buylist state
  const [isAddBuylistModalOpen, setIsAddBuylistModalOpen] = useState(false);
  const [buyScryfallQuery, setBuyScryfallQuery] = useState('');
  const [buyScryfallResults, setBuyScryfallResults] = useState<any[]>([]);
  const [buyScryfallLoading, setBuyScryfallLoading] = useState(false);
  const [selectedBuyScryfallCard, setSelectedBuyScryfallCard] = useState<any | null>(null);
  const [newBuyPrice, setNewBuyPrice] = useState('10.00');
  const [newBuyQty, setNewBuyQty] = useState('1');
  const [newBuyMinCondition, setNewBuyMinCondition] = useState('LP');
  const [newBuyFoil, setNewBuyFoil] = useState('2');
  const [newBuyNotes, setNewBuyNotes] = useState('');

  // Bulk Buylist import state
  const [isBulkBuylistModalOpen, setIsBulkBuylistModalOpen] = useState(false);
  const [bulkBuylistInputType, setBulkBuylistInputType] = useState<'text' | 'csv'>('text');
  const [bulkBuylistText, setBulkBuylistText] = useState('');
  const [bulkBuylistCsv, setBulkBuylistCsv] = useState('');
  const [bulkBuylistCsvFileName, setBulkBuylistCsvFileName] = useState('');
  const [bulkBuylistPricingMode, setBulkBuylistPricingMode] = useState<'percent' | 'fixed' | 'csv'>('percent');
  const [bulkBuylistPercentRate, setBulkBuylistPercentRate] = useState('75');
  const [bulkBuylistFixedPrice, setBulkBuylistFixedPrice] = useState('10.00');
  const [bulkBuylistMinCondition, setBulkBuylistMinCondition] = useState('LP');
  const [bulkBuylistFoil, setBulkBuylistFoil] = useState('2');
  const [bulkBuylistNotes, setBulkBuylistNotes] = useState('');
  const [bulkBuylistLoading, setBulkBuylistLoading] = useState(false);
  const [bulkBuylistPreview, setBulkBuylistPreview] = useState<BuylistBulkPreviewItem[] | null>(null);
  const [bulkBuylistError, setBulkBuylistError] = useState('');
  const [bulkBuylistResult, setBulkBuylistResult] = useState<string | null>(null);

  // Inventory state
  const [cards, setCards] = useState<Card[]>([]);
  const [invSearch, setInvSearch] = useState('');
  const [invSet, setInvSet] = useState('');
  const [invRarity, setInvRarity] = useState('');
  const [invFoil, setInvFoil] = useState<'all' | 'foil' | 'non_foil'>('all');
  const [invStock, setInvStock] = useState<'all' | 'in_stock' | 'out_of_stock'>('all');
  const [invLoading, setInvLoading] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  // Manual Add Card / Scryfall state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [scryfallQuery, setScryfallQuery] = useState('');
  const [scryfallResults, setScryfallResults] = useState<any[]>([]);
  const [scryfallLoading, setScryfallLoading] = useState(false);
  const [selectedScryfallCard, setSelectedScryfallCard] = useState<any | null>(null);
  const [newCardPrice, setNewCardPrice] = useState('10.00');
  const [newCardQty, setNewCardQty] = useState('1');
  const [newCardCondition, setNewCardCondition] = useState('NM');
  const [newCardFoil, setNewCardFoil] = useState(false);

  // Bulk Condition change state
  const [isBulkConditionModalOpen, setIsBulkConditionModalOpen] = useState(false);
  const [bulkFromCondition, setBulkFromCondition] = useState('NM');
  const [bulkToCondition, setBulkToCondition] = useState('LP/EX');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [bulkError, setBulkError] = useState('');

  // ManaBox import state
  const [csvContent, setCsvContent] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [importMode, setImportMode] = useState<'csv' | 'scryfall' | 'fixed'>('csv');
  const [importConvertNmToLp, setImportConvertNmToLp] = useState(false);
  const [fixedPriceInput, setFixedPriceInput] = useState('5.00');
  const [eurRateInput, setEurRateInput] = useState('4.30');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [previewSample, setPreviewSample] = useState<any[] | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    store_title: '',
    store_subtitle: '',
    pickup_days: '',
    discord_webhook: '',
    eur_to_pln: '4.30',
    admin_password: 'haslo',
    admin_pin: 'haslo',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [webhookTestStatus, setWebhookTestStatus] = useState<string | null>(null);

  // QR Code state
  const [qrUrl, setQrUrl] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Check saved password on mount
  useEffect(() => {
    const savedPass = localStorage.getItem('mtg_admin_password') || localStorage.getItem('mtg_admin_pin');
    if (savedPass) {
      setPassword(savedPass);
      verifyPassword(savedPass);
    }
  }, []);

  const verifyPassword = async (inputPassword: string) => {
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: inputPassword, pin: inputPassword }),
      });
      if (res.ok) {
        setIsAuth(true);
        localStorage.setItem('mtg_admin_password', inputPassword);
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Nieprawidłowe hasło.');
        setIsAuth(false);
      }
    } catch {
      setAuthError('Błąd połączenia z serwerem.');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    verifyPassword(password);
  };

  const handleLogout = () => {
    localStorage.removeItem('mtg_admin_password');
    localStorage.removeItem('mtg_admin_pin');
    setIsAuth(false);
    setPassword('');
  };

  // Fetch initial data when authenticated
  useEffect(() => {
    if (!isAuth) return;
    fetchReservations();
    fetchInventory();
    fetchBuylist();
    fetchBuylistOffers();
    fetchAdminSettings();

    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setQrUrl(origin);
      generateQR(origin);
    }
  }, [isAuth]);

  const generateQR = async (url: string) => {
    try {
      const dataUri = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#020617', light: '#ffffff' },
      });
      setQrDataUrl(dataUri);
    } catch (err) {
      console.error('Error generating QR:', err);
    }
  };

  // Fetch Reservations
  const fetchReservations = async () => {
    setResLoading(true);
    try {
      const res = await fetch('/api/admin/reservations', {
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      const data = await res.json();
      if (data.reservations) {
        setReservations(data.reservations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResLoading(false);
    }
  };

  const updateReservationStatus = async (id: number, status: 'completed' | 'cancelled') => {
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchReservations();
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Inventory
  const fetchInventory = async () => {
    setInvLoading(true);
    try {
      const params = new URLSearchParams();
      if (invSearch.trim()) params.set('q', invSearch.trim());
      if (invSet) params.set('set', invSet);
      if (invRarity) params.set('rarity', invRarity);
      if (invFoil === 'foil') params.set('foil', 'true');
      else if (invFoil === 'non_foil') params.set('foil', 'false');
      if (invStock === 'in_stock') params.set('in_stock', 'true');
      else if (invStock === 'out_of_stock') params.set('in_stock', 'false');

      const res = await fetch(`/api/admin/cards?${params.toString()}`, {
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      const data = await res.json();
      if (data.cards) {
        setCards(data.cards);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInvLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuth) return;
    const timer = setTimeout(() => {
      fetchInventory();
    }, 200);
    return () => clearTimeout(timer);
  }, [invSearch, invSet, invRarity, invFoil, invStock, isAuth]);

  useEffect(() => {
    if (!isAuth) return;
    const timer = setTimeout(() => {
      fetchBuylist();
    }, 250);
    return () => clearTimeout(timer);
  }, [buylistSearch, isAuth]);

  const handleUpdateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    try {
      const res = await fetch(`/api/admin/cards/${editingCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          price_pln: editingCard.price_pln,
          quantity: editingCard.quantity,
          condition: editingCard.condition,
          foil: editingCard.foil,
        }),
      });
      if (res.ok) {
        setEditingCard(null);
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCard = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kartę z magazynu?')) return;
    try {
      const res = await fetch(`/api/admin/cards/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Buylist Fetch & Actions
  const fetchBuylist = async () => {
    setBuylistLoading(true);
    try {
      const res = await fetch(`/api/admin/buylist?q=${encodeURIComponent(buylistSearch)}`, {
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      const data = await res.json();
      if (data.cards) {
        setBuylistCards(data.cards);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuylistLoading(false);
    }
  };

  const handleUpdateBuylistCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBuylistCard) return;

    try {
      const res = await fetch(`/api/admin/buylist/${editingBuylistCard.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          price_pln: editingBuylistCard.price_pln,
          quantity: editingBuylistCard.quantity,
          min_condition: editingBuylistCard.min_condition,
          foil: editingBuylistCard.foil,
          notes: editingBuylistCard.notes,
        }),
      });
      if (res.ok) {
        setEditingBuylistCard(null);
        fetchBuylist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBuylistCard = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kartę z listy skupu?')) return;
    try {
      const res = await fetch(`/api/admin/buylist/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      if (res.ok) {
        fetchBuylist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Buylist Scryfall Search
  const handleBuyScryfallSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyScryfallQuery.trim()) return;

    setBuyScryfallLoading(true);
    try {
      const res = await fetch(`/api/admin/search-scryfall?q=${encodeURIComponent(buyScryfallQuery)}`, {
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      const data = await res.json();
      setBuyScryfallResults(data.cards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBuyScryfallLoading(false);
    }
  };

  const handleSelectBuyScryfallCard = (card: any) => {
    setSelectedBuyScryfallCard(card);
    const eurPrice = card.prices?.eur ? parseFloat(card.prices.eur) : null;
    const rate = parseFloat(settings.eur_to_pln || '4.30') || 4.30;
    if (eurPrice) {
      // Suggest ~75% Cardmarket value as standard buylist cash payout
      setNewBuyPrice((eurPrice * rate * 0.75).toFixed(2));
    } else {
      setNewBuyPrice('10.00');
    }
  };

  const handleSaveNewBuylistCard = async () => {
    if (!selectedBuyScryfallCard) return;

    try {
      const res = await fetch('/api/admin/buylist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          name: selectedBuyScryfallCard.name,
          set_code: selectedBuyScryfallCard.set,
          set_name: selectedBuyScryfallCard.set_name,
          collector_number: selectedBuyScryfallCard.collector_number,
          scryfall_id: selectedBuyScryfallCard.id,
          image_url: selectedBuyScryfallCard.image_url,
          mana_cost: selectedBuyScryfallCard.mana_cost,
          colors: selectedBuyScryfallCard.colors,
          type_line: selectedBuyScryfallCard.type_line,
          rarity: selectedBuyScryfallCard.rarity,
          min_condition: newBuyMinCondition,
          foil: parseInt(newBuyFoil, 10),
          price_pln: parseFloat(newBuyPrice) || 0,
          quantity: parseInt(newBuyQty, 10) || 1,
          notes: newBuyNotes,
        }),
      });

      if (res.ok) {
        setIsAddBuylistModalOpen(false);
        setSelectedBuyScryfallCard(null);
        setBuyScryfallResults([]);
        setBuyScryfallQuery('');
        setNewBuyNotes('');
        fetchBuylist();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Buylist Offers Fetch & Actions
  const fetchBuylistOffers = async () => {
    setOffersLoading(true);
    try {
      const res = await fetch('/api/admin/buylist/offers', {
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      const data = await res.json();
      if (data.offers) {
        setBuylistOffers(data.offers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setOffersLoading(false);
    }
  };

  const handleUpdateOfferStatus = async (id: number, status: 'pending' | 'accepted' | 'completed' | 'rejected') => {
    try {
      const res = await fetch(`/api/admin/buylist/offers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchBuylistOffers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteOffer = async (id: number) => {
    if (!confirm('Czy na pewno chcesz usunąć tę ofertę sprzedaży?')) return;
    try {
      const res = await fetch(`/api/admin/buylist/offers/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      if (res.ok) {
        fetchBuylistOffers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Buylist Handlers
  const handleLoadSampleBuylistText = () => {
    const sample = `4 Orcish Bowmasters
2 Sheoldred, the Apocalypse (DMU) 107
4 Flooded Strand [MH3]
1 The One Ring *F*
2 Force of Will
4 Lightning Bolt`;
    setBulkBuylistText(sample);
    setBulkBuylistError('');
  };

  const handleBulkBuylistFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkBuylistCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setBulkBuylistCsv(content);
      setBulkBuylistError('');
    };
    reader.readAsText(file);
  };

  const handleBulkBuylistPreview = async () => {
    if (bulkBuylistInputType === 'text' && !bulkBuylistText.trim()) {
      setBulkBuylistError('Wklej listę kart do pola tekstowego.');
      return;
    }
    if (bulkBuylistInputType === 'csv' && !bulkBuylistCsv.trim()) {
      setBulkBuylistError('Wgraj lub wklej plik CSV.');
      return;
    }

    setBulkBuylistLoading(true);
    setBulkBuylistError('');
    setBulkBuylistResult(null);

    try {
      const res = await fetch('/api/admin/buylist/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          action: 'preview',
          text: bulkBuylistInputType === 'text' ? bulkBuylistText : '',
          csvContent: bulkBuylistInputType === 'csv' ? bulkBuylistCsv : '',
          pricingMode: bulkBuylistPricingMode,
          percentRate: parseFloat(bulkBuylistPercentRate) || 75,
          fixedPrice: parseFloat(bulkBuylistFixedPrice) || 10,
          eurRate: parseFloat(settings.eur_to_pln || '4.30') || 4.30,
          defaultMinCondition: bulkBuylistMinCondition,
          defaultFoil: parseInt(bulkBuylistFoil, 10),
          defaultNotes: bulkBuylistNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Błąd podczas przetwarzania listy.');
      }

      setBulkBuylistPreview(data.cards || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBulkBuylistError(msg);
    } finally {
      setBulkBuylistLoading(false);
    }
  };

  const handleBulkBuylistImport = async () => {
    if (!bulkBuylistPreview || bulkBuylistPreview.length === 0) return;

    setBulkBuylistLoading(true);
    setBulkBuylistError('');

    try {
      const res = await fetch('/api/admin/buylist/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          action: 'import',
          cards: bulkBuylistPreview,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Błąd podczas importu kart do skupu.');
      }

      setBulkBuylistResult(`Sukces: Dodano ${data.count} kart do listy skupu!`);
      setBulkBuylistPreview(null);
      setBulkBuylistText('');
      setBulkBuylistCsv('');
      fetchBuylist();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setBulkBuylistError(msg);
    } finally {
      setBulkBuylistLoading(false);
    }
  };

  const handleUpdatePreviewCardPrice = (index: number, newPrice: number) => {
    if (!bulkBuylistPreview) return;
    const updated = [...bulkBuylistPreview];
    updated[index] = { ...updated[index], price_pln: newPrice };
    setBulkBuylistPreview(updated);
  };

  const handleRemovePreviewCard = (index: number) => {
    if (!bulkBuylistPreview) return;
    setBulkBuylistPreview(bulkBuylistPreview.filter((_, i) => i !== index));
  };

  const handleBulkChangeCondition = async (from = bulkFromCondition, to = bulkToCondition) => {
    setBulkLoading(true);
    setBulkError('');
    setBulkMessage('');
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          fromCondition: from,
          toCondition: to,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBulkMessage(data.message || `Pomyślnie zaktualizowano stan kart na ${to}.`);
        fetchInventory();
        setTimeout(() => {
          setIsBulkConditionModalOpen(false);
          setBulkMessage('');
        }, 1500);
      } else {
        setBulkError(data.error || 'Wystąpił błąd podczas zmiany stanu kart.');
      }
    } catch (err) {
      console.error(err);
      setBulkError('Błąd połączenia z serwerem.');
    } finally {
      setBulkLoading(false);
    }
  };

  // Scryfall Search
  const handleScryfallSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scryfallQuery.trim()) return;

    setScryfallLoading(true);
    try {
      const res = await fetch(`/api/admin/search-scryfall?q=${encodeURIComponent(scryfallQuery)}`, {
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      const data = await res.json();
      setScryfallResults(data.cards || []);
    } catch (err) {
      console.error(err);
    } finally {
      setScryfallLoading(false);
    }
  };

  const handleSelectScryfallCard = (card: any) => {
    setSelectedScryfallCard(card);
    const eurPrice = card.prices?.eur ? parseFloat(card.prices.eur) : null;
    const rate = parseFloat(settings.eur_to_pln || '4.30') || 4.30;
    if (eurPrice) {
      setNewCardPrice((eurPrice * rate).toFixed(2));
    } else {
      setNewCardPrice('10.00');
    }
  };

  const handleSaveNewCard = async () => {
    if (!selectedScryfallCard) return;

    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          name: selectedScryfallCard.name,
          set_code: selectedScryfallCard.set,
          set_name: selectedScryfallCard.set_name,
          collector_number: selectedScryfallCard.collector_number,
          scryfall_id: selectedScryfallCard.id,
          image_url: selectedScryfallCard.image_url,
          mana_cost: selectedScryfallCard.mana_cost,
          colors: selectedScryfallCard.colors,
          type_line: selectedScryfallCard.type_line,
          rarity: selectedScryfallCard.rarity,
          condition: newCardCondition,
          foil: newCardFoil ? 1 : 0,
          price_pln: parseFloat(newCardPrice) || 0,
          price_eur: selectedScryfallCard.prices?.eur ? parseFloat(selectedScryfallCard.prices.eur) : null,
          quantity: parseInt(newCardQty, 10) || 1,
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        setSelectedScryfallCard(null);
        setScryfallResults([]);
        setScryfallQuery('');
        fetchInventory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ManaBox File Upload & Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
      handlePreviewCsv(content);
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsv = async () => {
    try {
      const res = await fetch('/sample_manabox.csv');
      const text = await res.text();
      setCsvContent(text);
      setCsvFileName('sample_manabox.csv');
      handlePreviewCsv(text);
    } catch {
      // fallback sample
      const sample = `Name,Set code,Set name,Collector number,Foil,Rarity,Quantity,ManaBox ID,Scryfall ID,Purchase price,Condition,Language,Purchase price currency
Ragavan, Nimble Pilferer,mh2,Modern Horizons 2,138,normal,mythic,1,123456,07142ce2-b420-49f8-808a-6b8a8b111b1f,180.00,Near Mint,en,PLN
Sol Ring,cmm,Commander Masters,401,normal,uncommon,2,123457,4a26e84d-2856-42d8-94ff-f6d8c366ff5d,7.50,Near Mint,en,PLN
Counterspell,ema,Eternal Masters,43,foil,uncommon,1,123458,1622b724-406a-4648-912a-89a318df5650,15.00,Near Mint,en,PLN
Lightning Bolt,clb,Commander Legends: Battle for Baldur's Gate,187,normal,common,4,123459,f29ba16f-c8fb-42fe-aabf-87089cb214a7,3.00,Near Mint,en,PLN`;
      setCsvContent(sample);
      setCsvFileName('przykladowe_karty.csv');
      handlePreviewCsv(sample);
    }
  };

  const handlePreviewCsv = async (content: string, convertNm = importConvertNmToLp) => {
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          csvContent: content,
          action: 'preview',
          convertNmToLp: convertNm,
        }),
      });
      const data = await res.json();
      if (data.sample) {
        setPreviewSample(data.sample);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteImport = async () => {
    if (!csvContent) return;

    setImportLoading(true);
    setImportResult(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({
          csvContent,
          action: 'import',
          priceMode: importMode,
          fixedPrice: parseFloat(fixedPriceInput) || 5,
          eurRate: parseFloat(eurRateInput) || 4.30,
          convertNmToLp: importConvertNmToLp,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(`Sukces: Zaimportowano ${data.count} kart!`);
        fetchInventory();
      } else {
        setImportResult(`Błąd: ${data.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportResult(`Błąd połączenia: ${msg}`);
    } finally {
      setImportLoading(false);
    }
  };

  // Fetch Settings
  const fetchAdminSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-password': password, 'x-admin-pin': password },
      });
      const data = await res.json();
      if (data.settings) {
        const pass = data.settings.admin_password || data.settings.admin_pin || 'haslo';
        setSettings({
          store_title: data.settings.store_title || '',
          store_subtitle: data.settings.store_subtitle || '',
          pickup_days: data.settings.pickup_days || '',
          discord_webhook: data.settings.discord_webhook || '',
          eur_to_pln: data.settings.eur_to_pln || '4.30',
          admin_password: pass,
          admin_pin: pass,
        });
        setEurRateInput(data.settings.eur_to_pln || '4.30');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsMessage('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
          'x-admin-pin': password,
        },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSettingsMessage('Ustawienia zapisane pomyślnie!');
        const updatedPass = settings.admin_password || settings.admin_pin;
        if (updatedPass && updatedPass !== password) {
          setPassword(updatedPass);
          localStorage.setItem('mtg_admin_password', updatedPass);
        }
      }
    } catch {
      setSettingsMessage('Błąd podczas zapisywania.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    setWebhookTestStatus('Wysyłanie testu...');
    try {
      const res = await fetch('/api/admin/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password, 'x-admin-pin': password,
        },
        body: JSON.stringify({ webhookUrl: settings.discord_webhook }),
      });
      const data = await res.json();
      if (res.ok) {
        setWebhookTestStatus('✅ Wiadomość testowa dotarła na Twój Discord!');
      } else {
        setWebhookTestStatus(`❌ ${data.error}`);
      }
    } catch {
      setWebhookTestStatus('❌ Błąd połączenia.');
    }
  };

  // If not authenticated, render password prompt
  if (!isAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100">
        <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 mx-auto">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-center text-lg font-bold text-white">Panel Administratora</h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Wpisz hasło, aby zarządzać kartami i rezerwacjami. Domyślne hasło: <code className="text-amber-400 font-bold">haslo</code>
          </p>

          <form onSubmit={handleLogin} className="mt-5 space-y-3">
            {authError && (
              <div className="rounded-lg bg-red-950/60 border border-red-800/80 p-2.5 text-xs text-red-300">
                {authError}
              </div>
            )}
            <input
              type="password"
              placeholder="Hasło"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-center text-base font-semibold text-white focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-amber-500 py-2.5 font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
            >
              Zaloguj się
            </button>
            <div className="text-center pt-2">
              <Link href="/" className="text-xs text-slate-500 hover:text-amber-400">
                ← Wróć do widoku kart
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filtered reservations
  const filteredRes = reservations.filter((r) => {
    if (resFilter === 'all') return true;
    return r.status === resFilter;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 font-black text-slate-950 text-sm">
              M
            </span>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Panel MTG Klaser</h1>
              <p className="text-[11px] text-slate-400">Zarządzanie magazynem, rezerwacjami i Scryfall</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Zobacz stronę
            </Link>
            <button
              onClick={handleLogout}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto py-2.5 no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold transition ${
              activeTab === 'reservations'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Package className="h-4 w-4" />
            Rezerwacje
            {reservations.filter((r) => r.status === 'pending').length > 0 && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.2 text-[10px] text-white">
                {reservations.filter((r) => r.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold transition ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="h-4 w-4" />
            Karty / Magazyn ({cards.length})
          </button>

          <button
            onClick={() => setActiveTab('buylist')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold transition ${
              activeTab === 'buylist'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <HandCoins className="h-4 w-4" />
            Skup / Buylist ({buylistCards.length})
          </button>

          <button
            onClick={() => setActiveTab('buylist_offers')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold transition ${
              activeTab === 'buylist_offers'
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Package className="h-4 w-4" />
            Oferty skupu
            {buylistOffers.filter((o) => o.status === 'pending').length > 0 && (
              <span className="ml-1 rounded-full bg-sky-500 px-1.5 py-0.2 text-[10px] text-white">
                {buylistOffers.filter((o) => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold transition ${
              activeTab === 'import'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Upload className="h-4 w-4" />
            Import z ManaBox
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            Ustawienia & Kod QR
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="mx-auto flex-1 max-w-6xl w-full p-4 sm:p-6">
        {/* ================= TAB 1: RESERVATIONS ================= */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Lista Rezerwacji</h2>
                <p className="text-xs text-slate-400">
                  Zamówienia złożone przez graczy z terminami odbioru.
                </p>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
                <button
                  onClick={() => setResFilter('pending')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    resFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Oczekujące
                </button>
                <button
                  onClick={() => setResFilter('completed')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    resFilter === 'completed'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Zrealizowane
                </button>
                <button
                  onClick={() => setResFilter('cancelled')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    resFilter === 'cancelled'
                      ? 'bg-red-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Anulowane
                </button>
                <button
                  onClick={() => setResFilter('all')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    resFilter === 'all'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wszystkie
                </button>
              </div>
            </div>

            {resLoading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-500" />
                <p className="mt-2 text-xs">Ładowanie rezerwacji...</p>
              </div>
            ) : filteredRes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 py-12 text-center text-slate-500 text-sm">
                Brak rezerwacji w tej kategorii.
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRes.map((res) => (
                  <div
                    key={res.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">#{res.id}</span>
                          <span className="text-base font-bold text-amber-400">{res.buyer_name}</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              res.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : res.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {res.status === 'pending'
                              ? 'Oczekuje'
                              : res.status === 'completed'
                              ? 'Odebrane'
                              : 'Anulowane'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                          <span>Kontakt: <strong className="text-slate-200">{res.buyer_contact}</strong></span>
                          <span>•</span>
                          <span>Odbiór: <strong className="text-amber-400">{res.pickup_day}</strong></span>
                          <span>•</span>
                          <span>Złożono: {new Date(res.created_at).toLocaleString('pl-PL')}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 sm:pt-0">
                        {res.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateReservationStatus(res.id, 'completed')}
                              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              Wydano / Odebrane
                            </button>
                            <button
                              onClick={() => updateReservationStatus(res.id, 'cancelled')}
                              className="flex items-center gap-1 rounded-lg bg-red-950/80 border border-red-800/80 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/80 transition"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Anuluj
                            </button>
                          </>
                        )}
                        {res.status === 'completed' && (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Zrealizowano
                          </span>
                        )}
                        {res.status === 'cancelled' && (
                          <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                            <XCircle className="h-4 w-4" /> Anulowano (karty zwrócone do stanu)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Notes if any */}
                    {res.notes && (
                      <div className="mt-2.5 rounded-lg bg-slate-950 p-2 text-xs text-slate-400">
                        <strong className="text-slate-300">Uwagi:</strong> {res.notes}
                      </div>
                    )}

                    {/* Items list */}
                    <div className="mt-3 divide-y divide-slate-800/60">
                      {res.items?.map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 text-xs">
                          <div className="flex items-center gap-2.5">
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.card_name}
                                className="h-9 w-6 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-semibold text-slate-200">
                                {item.quantity}x {item.card_name}
                                {item.foil === 1 && (
                                  <span className="ml-1 text-amber-400">✨ Foil</span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {item.set_code?.toUpperCase()} #{item.collector_number} • {item.condition}
                              </div>
                            </div>
                          </div>
                          <div className="font-bold text-amber-400">
                            {(item.price_pln * item.quantity).toFixed(2)} PLN
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total Price */}
                    <div className="mt-2 flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
                      <span>Łączna kwota do pobrania:</span>
                      <span className="text-amber-400 text-base">{res.total_price_pln.toFixed(2)} PLN</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: INVENTORY ================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Magazyn Kart ({cards.length})</h2>
                <p className="text-xs text-slate-400">
                  Łączna wartość magazynu:{' '}
                  <strong className="text-amber-400">
                    {cards.reduce((sum, c) => sum + c.price_pln * c.quantity, 0).toFixed(2)} PLN
                  </strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkFromCondition('NM');
                    setBulkToCondition('LP/EX');
                    setBulkError('');
                    setBulkMessage('');
                    setIsBulkConditionModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 shadow-sm transition hover:bg-amber-500/20"
                  title="Zmień stan wszystkim kartom z NM na LP/EX"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Zmień NM → LP/EX
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
                >
                  <Plus className="h-4 w-4" />
                  Dodaj kartę (Scryfall)
                </button>
              </div>
            </div>

            {/* Search and Filters Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Szukaj po nazwie, dodatku lub typie..."
                  value={invSearch}
                  onChange={(e) => setInvSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pr-4 pl-9 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Rarity */}
                <select
                  value={invRarity}
                  onChange={(e) => setInvRarity(e.target.value)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="">Rzadkość: Wszystkie</option>
                  <option value="mythic">Mityczna (Mythic)</option>
                  <option value="rare">Rzadka (Rare)</option>
                  <option value="uncommon">Niezwykła (Uncommon)</option>
                  <option value="common">Zwykła (Common)</option>
                </select>

                {/* Foil */}
                <select
                  value={invFoil}
                  onChange={(e) => setInvFoil(e.target.value as any)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Wersja: Wszystkie</option>
                  <option value="foil">✨ Tylko Foil</option>
                  <option value="non_foil">Zwykła (Non-foil)</option>
                </select>

                {/* Stock status */}
                <select
                  value={invStock}
                  onChange={(e) => setInvStock(e.target.value as any)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-300 focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">Stan: Wszystkie</option>
                  <option value="in_stock">Tylko na stanie (&gt;0)</option>
                  <option value="out_of_stock">Brak na stanie (=0)</option>
                </select>

                {/* Reset button */}
                {(invSearch || invSet || invRarity || invFoil !== 'all' || invStock !== 'all') && (
                  <button
                    onClick={() => {
                      setInvSearch('');
                      setInvSet('');
                      setInvRarity('');
                      setInvFoil('all');
                      setInvStock('all');
                    }}
                    className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-amber-400 hover:text-amber-300 hover:border-slate-700 transition ml-auto"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Wyczyść filtry
                  </button>
                )}
              </div>
            </div>

            {invLoading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-amber-500" />
                <p className="mt-2 text-xs">Ładowanie magazynu...</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 py-12 text-center text-slate-500 text-sm">
                Brak kart w bazie. Wgraj plik CSV z ManaBoxa w zakładce „Import z ManaBox” lub dodaj pojedynczą kartę.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Karta</th>
                      <th className="px-4 py-3">Dodatek</th>
                      <th className="px-4 py-3">Stan</th>
                      <th className="px-4 py-3">Foil</th>
                      <th className="px-4 py-3">Cena (PLN)</th>
                      <th className="px-4 py-3">Ilość</th>
                      <th className="px-4 py-3 text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {cards.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            {c.image_url && (
                              <img
                                src={c.image_url}
                                alt={c.name}
                                className="h-8 w-6 rounded object-cover"
                              />
                            )}
                            <div>
                              <div className="font-bold text-slate-200">{c.name}</div>
                              <div className="text-[10px] text-slate-500">{c.type_line}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-mono text-slate-300 uppercase">
                            {c.set_code} #{c.collector_number}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                            {c.condition}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {c.foil === 1 ? (
                            <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                              <Sparkles className="h-3 w-3" /> Foil
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-amber-400">
                          {c.price_pln.toFixed(2)} PLN
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded px-2 py-0.5 font-semibold text-[11px] ${
                              c.quantity > 0
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {c.quantity} szt.
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                const cond =
                                  c.condition === 'Near Mint'
                                    ? 'NM'
                                    : c.condition === 'LP'
                                    ? 'LP/EX'
                                    : c.condition;
                                setEditingCard({ ...c, condition: cond });
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                              title="Edytuj"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(c.id)}
                              className="rounded p-1 text-slate-500 hover:bg-red-950/60 hover:text-red-400"
                              title="Usuń"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: BUYLIST (SKUP KART) ================= */}
        {activeTab === 'buylist' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HandCoins className="h-5 w-5 text-sky-400" />
                  Lista Skupu (Karty, które chcę kupić)
                </h2>
                <p className="text-xs text-slate-400">
                  Karty, których poszukujesz. Gracze po zeskanowaniu QR zobaczą je w zakładce „Skup” z oferowaną ceną.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddBuylistModalOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-3.5 py-2 text-xs font-bold text-slate-200 shadow-md transition hover:bg-slate-700 hover:text-white"
                >
                  <Plus className="h-4 w-4 text-sky-400" />
                  Dodaj pojedynczą kartę
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsBulkBuylistModalOpen(true);
                    setBulkBuylistPreview(null);
                    setBulkBuylistError('');
                    setBulkBuylistResult(null);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/25 transition hover:from-sky-500 hover:to-blue-500 active:scale-95"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Masowe dodawanie (Lista / CSV)
                </button>
              </div>
            </div>

            {/* Search filter */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filtruj listę skupu po nazwie lub dodatku..."
                value={buylistSearch}
                onChange={(e) => setBuylistSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pr-4 pl-9 text-xs text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {buylistLoading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-sky-400" />
                <p className="mt-2 text-xs">Ładowanie listy skupu...</p>
              </div>
            ) : buylistCards.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 py-12 text-center text-slate-500 text-sm">
                Brak kart na liście skupu. Kliknij przycisk powyżej, aby dodać poszukiwane karty przez Scryfall!
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-lg">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                    <tr>
                      <th className="py-3 pl-4 pr-2 font-semibold">Karta</th>
                      <th className="px-2 py-3 font-semibold">Dodatek</th>
                      <th className="px-2 py-3 font-semibold">Wersja & Stan</th>
                      <th className="px-2 py-3 font-semibold text-right">Płacę (PLN)</th>
                      <th className="px-2 py-3 font-semibold text-center">Szukam</th>
                      <th className="px-2 py-3 font-semibold">Uwagi</th>
                      <th className="py-3 pr-4 pl-2 font-semibold text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {buylistCards.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-2.5 pl-4 pr-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-7 flex-shrink-0 overflow-hidden rounded bg-slate-950">
                              {c.image_url ? (
                                <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[7px] text-slate-600">MTG</div>
                              )}
                            </div>
                            <span className="font-bold text-white line-clamp-1">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 font-mono text-[11px] text-slate-400 uppercase">
                          {c.set_code || '-'} {c.collector_number ? `#${c.collector_number}` : ''}
                        </td>
                        <td className="px-2 py-2.5 text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-sky-950/70 border border-sky-800/50 px-1.5 py-0.5 text-[10px] text-sky-300">
                              Min. {c.min_condition || 'LP'}
                            </span>
                            {c.foil === 1 ? (
                              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-300 font-semibold">
                                Foil ✨
                              </span>
                            ) : c.foil === 0 ? (
                              <span className="text-[10px] text-slate-400">Non-foil</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Dowolna</span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2.5 text-right font-bold text-emerald-400">
                          {c.price_pln.toFixed(2)} zł
                        </td>
                        <td className="px-2 py-2.5 text-center font-bold text-slate-200">
                          {c.quantity} szt.
                        </td>
                        <td className="px-2 py-2.5 text-[11px] text-slate-400 max-w-xs truncate">
                          {c.notes || '-'}
                        </td>
                        <td className="py-2.5 pr-4 pl-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setEditingBuylistCard(c)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                              title="Edytuj"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBuylistCard(c.id)}
                              className="rounded p-1 text-slate-500 hover:bg-red-950/60 hover:text-red-400"
                              title="Usuń"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: BUYLIST OFFERS (OFERTY OD GRACZY) ================= */}
        {activeTab === 'buylist_offers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-sky-400" />
                  Otrzymane Oferty Skupu
                </h2>
                <p className="text-xs text-slate-400">
                  Gracze, którzy zgłosili chęć przyniesienia i sprzedaży kart z Twojej listy skupu.
                </p>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 p-1 text-xs">
                <button
                  onClick={() => setOfferFilter('pending')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    offerFilter === 'pending'
                      ? 'bg-sky-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Oczekujące
                </button>
                <button
                  onClick={() => setOfferFilter('accepted')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    offerFilter === 'accepted'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Zaakceptowane
                </button>
                <button
                  onClick={() => setOfferFilter('completed')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    offerFilter === 'completed'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Zrealizowane
                </button>
                <button
                  onClick={() => setOfferFilter('rejected')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    offerFilter === 'rejected'
                      ? 'bg-red-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Odrzucone
                </button>
                <button
                  onClick={() => setOfferFilter('all')}
                  className={`rounded px-2.5 py-1 font-medium transition ${
                    offerFilter === 'all'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wszystkie
                </button>
              </div>
            </div>

            {offersLoading ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-sky-400" />
                <p className="mt-2 text-xs">Ładowanie ofert...</p>
              </div>
            ) : buylistOffers.filter((o) => offerFilter === 'all' || o.status === offerFilter).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 py-12 text-center text-slate-500 text-sm">
                Brak ofert sprzedaży w tej kategorii.
              </div>
            ) : (
              <div className="grid gap-4">
                {buylistOffers
                  .filter((o) => offerFilter === 'all' || o.status === offerFilter)
                  .map((offer) => (
                    <div
                      key={offer.id}
                      className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-white">Oferta #{offer.id}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                offer.status === 'pending'
                                  ? 'bg-sky-500/20 text-sky-300'
                                  : offer.status === 'accepted'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : offer.status === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : 'bg-red-500/20 text-red-300'
                              }`}
                            >
                              {offer.status === 'pending'
                                ? 'OCZEKUJĄCA'
                                : offer.status === 'accepted'
                                ? 'ZAAKCEPTOWANA'
                                : offer.status === 'completed'
                                ? 'ZREALIZOWANA (WYPŁACONO)'
                                : 'ODRZUCONA'}
                            </span>
                            <span className="text-xs text-slate-500">{offer.created_at}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-4 text-xs text-slate-300">
                            <span>Sprzedający: <strong className="text-white">{offer.seller_name}</strong></span>
                            <span>Kontakt: <strong className="text-sky-400">{offer.seller_contact}</strong></span>
                            <span>Dzień przekazania: <strong className="text-emerald-400">{offer.meeting_day}</strong></span>
                          </div>
                          {offer.notes && (
                            <p className="mt-1 text-xs text-slate-400 italic">
                              Uwagi: {offer.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {offer.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateOfferStatus(offer.id, 'accepted')}
                                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition"
                              >
                                Zaakceptuj
                              </button>
                              <button
                                onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-red-950/60 hover:text-red-300 transition"
                              >
                                Odrzuć
                              </button>
                            </>
                          )}
                          {offer.status === 'accepted' && (
                            <>
                              <button
                                onClick={() => handleUpdateOfferStatus(offer.id, 'completed')}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                              >
                                Wypłacono i odebrano
                              </button>
                              <button
                                onClick={() => handleUpdateOfferStatus(offer.id, 'rejected')}
                                className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-red-950/60 hover:text-red-300 transition"
                              >
                                Odrzuć
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteOffer(offer.id)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-950/60 hover:text-red-400 transition"
                            title="Usuń ofertę"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="text-slate-500 border-b border-slate-800">
                              <th className="py-1">Karta</th>
                              <th className="py-1">Dodatek</th>
                              <th className="py-1">Stan / Foil</th>
                              <th className="py-1 text-center">Ilość</th>
                              <th className="py-1 text-right">Cena jedn.</th>
                              <th className="py-1 text-right">Razem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            {offer.items?.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-1.5 text-slate-200 font-semibold">{item.card_name}</td>
                                <td className="py-1.5 font-mono uppercase text-slate-400 text-[11px]">
                                  {item.set_code || '-'} #{item.collector_number || ''}
                                </td>
                                <td className="py-1.5 text-slate-400">
                                  {item.condition} {item.foil ? '✨ Foil' : ''}
                                </td>
                                <td className="py-1.5 text-center text-slate-300 font-bold">{item.quantity} szt.</td>
                                <td className="py-1.5 text-right text-slate-400">{item.offered_price_pln.toFixed(2)} zł</td>
                                <td className="py-1.5 text-right font-bold text-emerald-400">
                                  {(item.offered_price_pln * item.quantity).toFixed(2)} zł
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-slate-800 pt-2 text-xs">
                        <span className="text-slate-400">Łącznie do wypłaty dla gracza:</span>
                        <strong className="text-base text-emerald-400">{offer.total_payout_pln.toFixed(2)} PLN</strong>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: MANABOX IMPORT ================= */}
        {activeTab === 'import' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">Import Kart z ManaBox</h2>
              <p className="text-xs text-slate-400">
                Wgraj plik CSV wyeksportowany z aplikacji ManaBox, aby natychmiast załadować całą kolekcję.
              </p>
            </div>

            {/* Quick action: sample file */}
            <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-amber-300">Chcesz szybko przetestować?</div>
                  <div className="text-[11px] text-amber-200/80">
                    Załaduj gotowy przykładowy plik (Ragavan, Sol Ring, Counterspell, The One Ring itp.)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLoadSampleCsv}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                Załaduj testowe karty
              </button>
            </div>

            {/* Upload Zone */}
            <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/60 p-6 text-center">
              <input
                type="file"
                accept=".csv"
                id="manabox-csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <label
                htmlFor="manabox-csv"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-slate-400 hover:text-white transition">
                  <Upload className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {csvFileName ? `Wybrano plik: ${csvFileName}` : 'Kliknij, aby wybrać plik CSV z ManaBox'}
                </div>
                <p className="text-xs text-slate-500">
                  Aplikacja ManaBox → Twój Klaser / Folder → Trzy kropki (...) → Export → CSV
                </p>
              </label>
            </div>

            {/* Import Settings */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">Ustawienia Cenowe Importu</h3>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="priceMode"
                    value="csv"
                    checked={importMode === 'csv'}
                    onChange={() => setImportMode('csv')}
                    className="accent-amber-500"
                  />
                  <span>
                    <strong>Ceny z pliku CSV:</strong> Użyj cen zakupu zapisanych w ManaBoxie (w PLN lub przeliczone z EUR/USD)
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="priceMode"
                    value="scryfall"
                    checked={importMode === 'scryfall'}
                    onChange={() => setImportMode('scryfall')}
                    className="accent-amber-500"
                  />
                  <span>
                    <strong>Świeże ceny Cardmarket (Scryfall):</strong> Pobierz aktualną rynkową cenę EUR ze Scryfall i przelicz na PLN
                  </span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="priceMode"
                    value="fixed"
                    checked={importMode === 'fixed'}
                    onChange={() => setImportMode('fixed')}
                    className="accent-amber-500"
                  />
                  <span>
                    <strong>Stała cena dla wszystkich kart:</strong> Ustaw tę samą cenę (np. dla klasera kart po 5 PLN)
                  </span>
                </label>
              </div>

              {importMode === 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Stała cena za kartę (PLN)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={fixedPriceInput}
                    onChange={(e) => setFixedPriceInput(e.target.value)}
                    className="w-32 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              {importMode !== 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Kurs przelicznika EUR → PLN
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={eurRateInput}
                    onChange={(e) => setEurRateInput(e.target.value)}
                    className="w-32 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              {/* Condition transform option */}
              <div className="pt-2 border-t border-slate-800">
                <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importConvertNmToLp}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setImportConvertNmToLp(val);
                      if (csvContent) {
                        handlePreviewCsv(csvContent, val);
                      }
                    }}
                    className="mt-0.5 accent-amber-500 h-4 w-4 rounded"
                  />
                  <div>
                    <span className="font-semibold text-slate-200">
                      Zamień stan z NM na LP/EX podczas importu
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Wszystkie karty oznaczone w pliku jako Near Mint (NM) zostaną automatycznie zapisane w bazie jako LP/EX.
                    </p>
                  </div>
                </label>
              </div>

              {/* Sample Preview */}
              {previewSample && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                  <div className="font-semibold text-slate-400">Podgląd pierwszych kart w pliku:</div>
                  {previewSample.map((s, idx) => (
                    <div key={idx} className="text-slate-300 text-[11px]">
                      • <strong>{s.name}</strong> ({s.set_code?.toUpperCase()} #{s.collector_number}) — {s.quantity} szt. [{s.condition}] {s.foil ? '✨ Foil' : ''}
                    </div>
                  ))}
                </div>
              )}

              {importResult && (
                <div
                  className={`rounded-lg p-3 text-xs ${
                    importResult.startsWith('Sukces')
                      ? 'bg-emerald-950/60 border border-emerald-800/80 text-emerald-300'
                      : 'bg-red-950/60 border border-red-800/80 text-red-300'
                  }`}
                >
                  {importResult}
                </div>
              )}

              <button
                type="button"
                disabled={!csvContent || importLoading}
                onClick={handleExecuteImport}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-bold text-slate-950 shadow-md transition hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
              >
                {importLoading ? 'Importowanie...' : 'Importuj karty do bazy'}
              </button>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SETTINGS & QR ================= */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* QR Code Section */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Twój Kod QR na Klaser / Deckbox</h3>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Gracz skanuje ten kod aparatem w telefonie, aby przejrzeć Twoje karty i złożyć rezerwację.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
                {qrDataUrl && (
                  <div className="rounded-2xl bg-white p-3 shadow-xl">
                    <img src={qrDataUrl} alt="QR Code" className="h-44 w-44 object-contain" />
                  </div>
                )}

                <div className="space-y-3 text-xs w-full sm:w-auto flex-1">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Adres URL docelowy dla kodu QR:
                    </label>
                    <input
                      type="text"
                      value={qrUrl}
                      onChange={(e) => {
                        setQrUrl(e.target.value);
                        generateQR(e.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {qrDataUrl && (
                      <a
                        href={qrDataUrl}
                        download="mtg_klaser_qrcode.png"
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
                      >
                        <Download className="h-4 w-4" />
                        Pobierz PNG
                      </a>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white"
                    >
                      <Printer className="h-4 w-4" />
                      Drukuj stronę z kodem
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* General Settings Form */}
            <form onSubmit={handleSaveSettings} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white">Ustawienia Aplikacji & Discord</h3>

              {settingsMessage && (
                <div className="rounded-lg bg-emerald-950/60 border border-emerald-800/80 p-2.5 text-xs text-emerald-300">
                  {settingsMessage}
                </div>
              )}

              {/* Discord Webhook */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Discord Webhook URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings.discord_webhook}
                    onChange={(e) => setSettings({ ...settings, discord_webhook: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleTestWebhook}
                    className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Testuj Webhook
                  </button>
                </div>
                {webhookTestStatus && (
                  <div className="text-xs text-slate-300 pt-1">{webhookTestStatus}</div>
                )}
                <p className="text-[11px] text-slate-500">
                  Na swoim serwerze Discord: Ustawienia kanału → Integracje → Webhooki → Nowy webhook → Kopiuj adres URL.
                </p>
              </div>

              {/* Store Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tytuł Klasera (widoczny u góry)
                </label>
                <input
                  type="text"
                  value={settings.store_title}
                  onChange={(e) => setSettings({ ...settings, store_title: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Podtytuł / Informacja
                </label>
                <input
                  type="text"
                  value={settings.store_subtitle}
                  onChange={(e) => setSettings({ ...settings, store_subtitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Pickup Days */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dni Odbioru (rozdzielone przecinkami)
                </label>
                <input
                  type="text"
                  value={settings.pickup_days}
                  onChange={(e) => setSettings({ ...settings, pickup_days: e.target.value })}
                  placeholder="np. Wtorek (turniej), Czwartek (commander)"
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  Dni pojawią się jako przyciski wyboru w koszyku rezerwacji oraz formularzu skupu (np. <code className="text-amber-400 font-mono">Wtorek, Czwartek, Sobota</code>).
                </p>
              </div>

              {/* EUR/PLN Rate */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Domyślny przelicznik EUR → PLN
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={settings.eur_to_pln}
                  onChange={(e) => setSettings({ ...settings, eur_to_pln: e.target.value })}
                  className="w-32 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Admin Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hasło do Panelu Admina
                </label>
                <input
                  type="password"
                  value={settings.admin_password || settings.admin_pin || ''}
                  onChange={(e) => setSettings({ ...settings, admin_password: e.target.value, admin_pin: e.target.value })}
                  placeholder="Hasło..."
                  className="w-48 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={settingsSaving}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 transition"
              >
                {settingsSaving ? 'Zapisywanie...' : 'Zapisz Ustawienia'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ================= MODAL: EDIT CARD ================= */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleUpdateCard}
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-3"
          >
            <h3 className="text-base font-bold text-white">Edytuj kartę: {editingCard.name}</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cena (PLN)</label>
              <input
                type="number"
                step="0.5"
                value={editingCard.price_pln}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, price_pln: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ilość w magazynie</label>
              <input
                type="number"
                value={editingCard.quantity}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, quantity: parseInt(e.target.value, 10) || 0 })
                }
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Stan (Condition)</label>
              <select
                value={
                  editingCard.condition === 'Near Mint'
                    ? 'NM'
                    : editingCard.condition === 'LP'
                    ? 'LP/EX'
                    : editingCard.condition
                }
                onChange={(e) => setEditingCard({ ...editingCard, condition: e.target.value })}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="NM">Near Mint (NM)</option>
                <option value="LP/EX">Lightly Played / Excellent (LP/EX)</option>
                <option value="MP">Moderately Played (MP)</option>
                <option value="HP">Heavily Played (HP)</option>
                <option value="DMG">Damaged (DMG)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit-foil"
                checked={editingCard.foil === 1}
                onChange={(e) =>
                  setEditingCard({ ...editingCard, foil: e.target.checked ? 1 : 0 })
                }
                className="accent-amber-500"
              />
              <label htmlFor="edit-foil" className="text-xs text-slate-300 font-semibold cursor-pointer">
                Wersja Foil ✨
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Zapisz zmiany
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: BULK CONDITION CHANGE ================= */}
      {isBulkConditionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Masowa zmiana stanu kart</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkConditionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Szybko zaktualizuj stan kart w całym magazynie (np. zmień wszystkie karty z <strong>NM</strong> na <strong>LP/EX</strong>).
            </p>

            {bulkMessage && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {bulkMessage}
              </div>
            )}

            {bulkError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {bulkError}
              </div>
            )}

            {/* Quick 1-click NM to LP/EX button */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300">Szybka akcja (Rekomendowana)</span>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {cards.filter((c) => c.condition === 'NM' || c.condition === 'Near Mint').length} kart NM
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Jednym kliknięciem zmień wszystkim kartom o stanie Near Mint (NM) stan na Lightly Played / Excellent (LP/EX).
              </p>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkChangeCondition('NM', 'LP/EX')}
                className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition disabled:opacity-50"
              >
                {bulkLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Zmień wszystkie NM → LP/EX
              </button>
            </div>

            {/* Custom from/to options */}
            <div className="space-y-3 pt-1 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300">Własny wybór:</div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Zmień karty o stanie:
                </label>
                <select
                  value={bulkFromCondition}
                  onChange={(e) => setBulkFromCondition(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="NM">NM / Near Mint ({cards.filter((c) => c.condition === 'NM' || c.condition === 'Near Mint').length} szt.)</option>
                  <option value="ALL">Wszystkie karty w bazie ({cards.length} szt.)</option>
                  <option value="LP/EX">LP/EX ({cards.filter((c) => c.condition === 'LP/EX' || c.condition === 'LP').length} szt.)</option>
                  <option value="MP">MP ({cards.filter((c) => c.condition === 'MP').length} szt.)</option>
                  <option value="HP">HP ({cards.filter((c) => c.condition === 'HP').length} szt.)</option>
                  <option value="DMG">DMG ({cards.filter((c) => c.condition === 'DMG').length} szt.)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Na nowy stan docelowy:
                </label>
                <select
                  value={bulkToCondition}
                  onChange={(e) => setBulkToCondition(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white"
                >
                  <option value="LP/EX">LP/EX (Lightly Played / Excellent)</option>
                  <option value="NM">NM (Near Mint)</option>
                  <option value="MP">MP (Moderately Played)</option>
                  <option value="HP">HP (Heavily Played)</option>
                  <option value="DMG">DMG (Damaged)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsBulkConditionModalOpen(false)}
                className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                Anuluj
              </button>
              <button
                type="button"
                disabled={bulkLoading}
                onClick={() => handleBulkChangeCondition(bulkFromCondition, bulkToCondition)}
                className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition disabled:opacity-50"
              >
                {bulkLoading ? 'Zapisywanie...' : 'Zastosuj zmianę'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CARD VIA SCRYFALL ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Dodaj kartę przez Scryfall</h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setSelectedScryfallCard(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search Scryfall */}
            <form onSubmit={handleScryfallSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Wpisz nazwę karty (np. Sol Ring, Sheoldred...)"
                value={scryfallQuery}
                onChange={(e) => setScryfallQuery(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400"
              >
                Szukaj
              </button>
            </form>

            {scryfallLoading && (
              <div className="py-6 text-center text-xs text-slate-400">
                Pobieranie wyników ze Scryfall...
              </div>
            )}

            {/* Every matching Scryfall printing across all editions */}
            {!selectedScryfallCard && scryfallResults.length > 0 && (
              <div className="text-[10px] text-slate-400">
                Znaleziono {scryfallResults.length} printów ze wszystkich dostępnych edycji. Wybierz konkretny wariant.
              </div>
            )}
            {!selectedScryfallCard && scryfallResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {scryfallResults.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleSelectScryfallCard(card)}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-2 hover:border-amber-500 cursor-pointer transition"
                  >
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="h-12 w-9 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">{card.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {card.set_name} ({card.set?.toUpperCase()} #{card.collector_number})
                      </div>
                    </div>
                    {card.prices?.eur && (
                      <div className="text-xs font-semibold text-amber-400">
                        ~{card.prices.eur} €
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selected card configuration */}
            {selectedScryfallCard && (
              <div className="rounded-xl border border-amber-500/40 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedScryfallCard.image_url}
                    alt={selectedScryfallCard.name}
                    className="h-16 w-11 rounded object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{selectedScryfallCard.name}</div>
                    <div className="text-xs text-slate-400">
                      {selectedScryfallCard.set_name} ({selectedScryfallCard.set?.toUpperCase()} #{selectedScryfallCard.collector_number})
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedScryfallCard(null)}
                      className="text-[11px] text-amber-400 hover:underline mt-1 block"
                    >
                      ← Wybierz inne wydanie
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cena (PLN)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newCardPrice}
                      onChange={(e) => setNewCardPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ilość sztuk</label>
                    <input
                      type="number"
                      value={newCardQty}
                      onChange={(e) => setNewCardQty(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Stan</label>
                    <select
                      value={newCardCondition}
                      onChange={(e) => setNewCardCondition(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    >
                      <option value="NM">Near Mint (NM)</option>
                      <option value="LP/EX">LP / Excellent</option>
                      <option value="MP">Moderately Played</option>
                      <option value="HP">Heavily Played</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="new-foil"
                      checked={newCardFoil}
                      onChange={(e) => setNewCardFoil(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <label htmlFor="new-foil" className="text-xs text-slate-300 font-semibold cursor-pointer">
                      Wersja Foil ✨
                    </label>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveNewCard}
                  className="w-full rounded-xl bg-amber-500 py-2.5 font-bold text-xs text-slate-950 hover:bg-amber-400 transition"
                >
                  Dodaj do magazynu
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ================= MODAL: ADD CARD TO BUYLIST VIA SCRYFALL ================= */}
      {isAddBuylistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-sky-900/60 bg-slate-900 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HandCoins className="h-4 w-4 text-sky-400" />
                Dodaj poszukiwaną kartę do Skupu
              </h3>
              <button
                onClick={() => {
                  setIsAddBuylistModalOpen(false);
                  setSelectedBuyScryfallCard(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Search Scryfall */}
            <form onSubmit={handleBuyScryfallSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Wpisz nazwę poszukiwanej karty (np. Bowmasters, Grief, Sheoldred...)"
                value={buyScryfallQuery}
                onChange={(e) => setBuyScryfallQuery(e.target.value)}
                className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500"
              >
                Szukaj
              </button>
            </form>

            {buyScryfallLoading && (
              <div className="py-6 text-center text-xs text-slate-400">
                Pobieranie wyników ze Scryfall...
              </div>
            )}

            {/* Every matching Scryfall printing across all editions */}
            {!selectedBuyScryfallCard && buyScryfallResults.length > 0 && (
              <div className="text-[10px] text-slate-400">
                Znaleziono {buyScryfallResults.length} printów ze wszystkich dostępnych edycji. Wybierz konkretny wariant.
              </div>
            )}
            {!selectedBuyScryfallCard && buyScryfallResults.length > 0 && (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {buyScryfallResults.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => handleSelectBuyScryfallCard(card)}
                    className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-2 hover:border-sky-500 cursor-pointer transition"
                  >
                    <img
                      src={card.image_url}
                      alt={card.name}
                      className="h-12 w-9 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-100 truncate">{card.name}</div>
                      <div className="text-[10px] text-slate-400">
                        {card.set_name} ({card.set?.toUpperCase()} #{card.collector_number})
                      </div>
                    </div>
                    {card.prices?.eur && (
                      <div className="text-xs font-semibold text-sky-400">
                        ~{card.prices.eur} €
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Selected card configuration */}
            {selectedBuyScryfallCard && (
              <div className="rounded-xl border border-sky-500/40 bg-slate-950 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedBuyScryfallCard.image_url}
                    alt={selectedBuyScryfallCard.name}
                    className="h-16 w-11 rounded object-cover"
                  />
                  <div>
                    <div className="text-sm font-bold text-white">{selectedBuyScryfallCard.name}</div>
                    <div className="text-xs text-slate-400">
                      {selectedBuyScryfallCard.set_name} ({selectedBuyScryfallCard.set?.toUpperCase()} #{selectedBuyScryfallCard.collector_number})
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBuyScryfallCard(null)}
                      className="text-[11px] text-sky-400 hover:underline mt-1 block"
                    >
                      ← Wybierz inne wydanie
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Oferowana cena skupu (PLN)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newBuyPrice}
                      onChange={(e) => setNewBuyPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Ilość sztuk, którą chcesz kupić</label>
                    <input
                      type="number"
                      value={newBuyQty}
                      onChange={(e) => setNewBuyQty(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Minimalny stan</label>
                    <select
                      value={newBuyMinCondition}
                      onChange={(e) => setNewBuyMinCondition(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    >
                      <option value="LP">Min. LP (Lightly Played / Excellent)</option>
                      <option value="NM">Tylko NM (Near Mint)</option>
                      <option value="MP">Min. MP (Played)</option>
                      <option value="ANY">Dowolny stan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Wymóg wersji</label>
                    <select
                      value={newBuyFoil}
                      onChange={(e) => setNewBuyFoil(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white"
                    >
                      <option value="2">Dowolna (Foil lub Non-foil)</option>
                      <option value="0">Tylko Non-foil</option>
                      <option value="1">Tylko Foil ✨</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Uwagi do skupu (opcjonalnie)</label>
                    <input
                      type="text"
                      placeholder="np. chętnie wezmę cały playset, wersja z retro ramką"
                      value={newBuyNotes}
                      onChange={(e) => setNewBuyNotes(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveNewBuylistCard}
                  className="w-full rounded-xl bg-sky-600 py-2.5 font-bold text-xs text-white hover:bg-sky-500 transition shadow-lg shadow-sky-600/20"
                >
                  Dodaj do listy skupu
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT BUYLIST CARD ================= */}
      {editingBuylistCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-sky-900/60 bg-slate-900 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white truncate">
                Edycja w skupie: {editingBuylistCard.name}
              </h3>
              <button
                onClick={() => setEditingBuylistCard(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateBuylistCard} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Oferowana cena (PLN)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingBuylistCard.price_pln}
                    onChange={(e) =>
                      setEditingBuylistCard({
                        ...editingBuylistCard,
                        price_pln: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Poszukiwana ilość</label>
                  <input
                    type="number"
                    value={editingBuylistCard.quantity}
                    onChange={(e) =>
                      setEditingBuylistCard({
                        ...editingBuylistCard,
                        quantity: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Minimalny stan</label>
                  <select
                    value={editingBuylistCard.min_condition}
                    onChange={(e) =>
                      setEditingBuylistCard({
                        ...editingBuylistCard,
                        min_condition: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  >
                    <option value="LP">Min. LP</option>
                    <option value="NM">Tylko NM</option>
                    <option value="MP">Min. MP</option>
                    <option value="ANY">Dowolny stan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Wymóg Foil</label>
                  <select
                    value={editingBuylistCard.foil}
                    onChange={(e) =>
                      setEditingBuylistCard({
                        ...editingBuylistCard,
                        foil: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  >
                    <option value={2}>Dowolna (Foil lub Non-foil)</option>
                    <option value={0}>Tylko Non-foil</option>
                    <option value={1}>Tylko Foil ✨</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Uwagi</label>
                  <input
                    type="text"
                    value={editingBuylistCard.notes || ''}
                    onChange={(e) =>
                      setEditingBuylistCard({
                        ...editingBuylistCard,
                        notes: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingBuylistCard(null)}
                  className="rounded-lg px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-500"
                >
                  Zapisz zmiany
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ================= MODAL: BULK BUYLIST IMPORT ================= */}
      {isBulkBuylistModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-sky-900/60 bg-slate-900 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-sky-400" />
                  Masowe dodawanie kart do skupu (Buylist)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Wklej całą listę poszukiwanych kart lub wgraj plik CSV. System automatycznie pobierze grafiki i wyceni karty ze Scryfall.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBulkBuylistModalOpen(false);
                  setBulkBuylistPreview(null);
                  setBulkBuylistError('');
                  setBulkBuylistResult(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {bulkBuylistResult && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {bulkBuylistResult}
              </div>
            )}

            {bulkBuylistError && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {bulkBuylistError}
              </div>
            )}

            {/* If no preview yet, show input form */}
            {!bulkBuylistPreview ? (
              <div className="space-y-4">
                {/* Mode tabs: Text vs CSV */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <button
                    type="button"
                    onClick={() => setBulkBuylistInputType('text')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      bulkBuylistInputType === 'text'
                        ? 'bg-sky-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    📝 Wklej listę tekstową (Wantlist / Decklist)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkBuylistInputType('csv')}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      bulkBuylistInputType === 'csv'
                        ? 'bg-sky-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    📁 Plik CSV (ManaBox)
                  </button>
                </div>

                {/* Text input view */}
                {bulkBuylistInputType === 'text' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-300">
                        Wklej karty (jedna w linijce):
                      </label>
                      <button
                        type="button"
                        onClick={handleLoadSampleBuylistText}
                        className="text-sky-400 hover:underline text-[11px]"
                      >
                        Załaduj przykładową listę (6 kart)
                      </button>
                    </div>

                    <textarea
                      rows={7}
                      value={bulkBuylistText}
                      onChange={(e) => setBulkBuylistText(e.target.value)}
                      placeholder={`np.:\n4 Orcish Bowmasters\n2 Sheoldred, the Apocalypse (DMU) 107\n4 Flooded Strand [MH3]\n1 The One Ring *F*\n2 Force of Will`}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-white placeholder-slate-600 focus:border-sky-500 focus:outline-none"
                    />

                    <p className="text-[11px] text-slate-500">
                      Obsługiwane formaty: <code className="text-slate-400">4 Orcish Bowmasters</code>, <code className="text-slate-400">1x Ragavan (MH2) 138</code>, <code className="text-slate-400">Sol Ring [CMM]</code>, opcjonalnie <code className="text-slate-400">*F*</code> lub <code className="text-slate-400">foil</code>.
                    </p>
                  </div>
                )}

                {/* CSV input view */}
                {bulkBuylistInputType === 'csv' && (
                  <div className="space-y-3">
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-4 text-center">
                      <Upload className="h-6 w-6 mx-auto text-sky-400 mb-2" />
                      <label className="cursor-pointer inline-block rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-500 transition">
                        Wybierz plik CSV
                        <input
                          type="file"
                          accept=".csv,text/csv"
                          onChange={handleBulkBuylistFileUpload}
                          className="hidden"
                        />
                      </label>
                      {bulkBuylistCsvFileName && (
                        <div className="mt-2 text-xs font-mono text-sky-300">
                          Wybrano: {bulkBuylistCsvFileName}
                        </div>
                      )}
                    </div>

                    {bulkBuylistCsv && (
                      <div>
                        <div className="text-[11px] text-slate-400 mb-1">Zawartość CSV:</div>
                        <textarea
                          rows={4}
                          value={bulkBuylistCsv}
                          onChange={(e) => setBulkBuylistCsv(e.target.value)}
                          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-slate-300 focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Pricing & Default Settings */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <SettingsIcon className="h-3.5 w-3.5 text-sky-400" />
                    Ustawienia wyceny i parametrów skupu
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Pricing Mode */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Sposób wyceny kart w skupie:
                      </label>
                      <select
                        value={bulkBuylistPricingMode}
                        onChange={(e) => setBulkBuylistPricingMode(e.target.value as any)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="percent">% wartości Cardmarket EUR (rekomendowane)</option>
                        <option value="fixed">Stała kwota PLN dla każdej karty</option>
                        {bulkBuylistInputType === 'csv' && (
                          <option value="csv">Cena z pliku CSV</option>
                        )}
                      </select>
                    </div>

                    {/* Rate / Amount input */}
                    {bulkBuylistPricingMode === 'percent' ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Procent wartości Cardmarket:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="10"
                            max="150"
                            step="5"
                            value={bulkBuylistPercentRate}
                            onChange={(e) => setBulkBuylistPercentRate(e.target.value)}
                            className="w-24 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                          />
                          <span className="text-xs text-slate-300 font-bold">%</span>
                          <span className="text-[11px] text-slate-500">
                            (kurs: {settings.eur_to_pln || '4.30'} zł)
                          </span>
                        </div>
                      </div>
                    ) : bulkBuylistPricingMode === 'fixed' ? (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Stała cena skupu za sztukę (PLN):
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={bulkBuylistFixedPrice}
                          onChange={(e) => setBulkBuylistFixedPrice(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                        />
                      </div>
                    ) : null}

                    {/* Default Condition */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Domyślny minimalny stan:
                      </label>
                      <select
                        value={bulkBuylistMinCondition}
                        onChange={(e) => setBulkBuylistMinCondition(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="LP">Min. LP (Lightly Played / Excellent)</option>
                        <option value="NM">Tylko NM (Near Mint)</option>
                        <option value="MP">Min. MP (Played)</option>
                        <option value="ANY">Dowolny stan</option>
                      </select>
                    </div>

                    {/* Default Foil */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Domyślna wersja Foil:
                      </label>
                      <select
                        value={bulkBuylistFoil}
                        onChange={(e) => setBulkBuylistFoil(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="2">Dowolna (Foil lub Non-foil)</option>
                        <option value="0">Tylko Non-foil</option>
                        <option value="1">Tylko Foil ✨</option>
                      </select>
                    </div>

                    {/* Default Notes */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Domyślne uwagi do skupu (opcjonalnie):
                      </label>
                      <input
                        type="text"
                        placeholder="np. chętnie wezmę cały playset, wersja z retro ramką"
                        value={bulkBuylistNotes}
                        onChange={(e) => setBulkBuylistNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  disabled={bulkBuylistLoading}
                  onClick={handleBulkBuylistPreview}
                  className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 py-3 font-bold text-xs text-white shadow-lg shadow-sky-600/20 hover:from-sky-500 hover:to-blue-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bulkBuylistLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Pobieranie kart ze Scryfall...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Pobierz dane ze Scryfall i sprawdź podgląd
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* ================= PREVIEW SCREEN ================= */
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="text-xs text-slate-300">
                    Rozpoznano: <strong className="text-white">{bulkBuylistPreview.length} kart</strong> (łącznie{' '}
                    <strong className="text-sky-400">
                      {bulkBuylistPreview.reduce((sum, c) => sum + c.quantity, 0)} sztuk
                    </strong>
                    ). Możesz dostosować ceny skupu bezpośrednio w tabeli.
                  </div>
                  <button
                    type="button"
                    onClick={() => setBulkBuylistPreview(null)}
                    className="text-xs text-sky-400 hover:underline"
                  >
                    ← Wróć do edycji listy
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 text-slate-400">
                      <tr>
                        <th className="py-2.5 pl-3 pr-2">Karta</th>
                        <th className="px-2 py-2.5">Dodatek</th>
                        <th className="px-2 py-2.5 text-center">Ilość</th>
                        <th className="px-2 py-2.5">Cardmarket</th>
                        <th className="px-2 py-2.5">Cena skupu (PLN)</th>
                        <th className="px-2 py-2.5">Wersja</th>
                        <th className="py-2.5 pr-3 pl-2 text-right">Usuń</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {bulkBuylistPreview.map((card, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50 transition">
                          <td className="py-2 pl-3 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="h-9 w-6 flex-shrink-0 overflow-hidden rounded bg-slate-900">
                                {card.image_url ? (
                                  <img src={card.image_url} alt={card.name} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[6px] text-slate-600">MTG</div>
                                )}
                              </div>
                              <span className="font-bold text-white truncate max-w-[180px]" title={card.name}>
                                {card.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-2 font-mono text-[11px] text-slate-400 uppercase">
                            {card.set_code || '-'} {card.collector_number ? `#${card.collector_number}` : ''}
                          </td>
                          <td className="px-2 py-2 text-center font-bold text-slate-200">
                            {card.quantity} szt.
                          </td>
                          <td className="px-2 py-2 text-slate-400 text-[11px]">
                            {card.market_eur ? `~${card.market_eur.toFixed(2)} €` : '—'}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              step="0.5"
                              value={card.price_pln}
                              onChange={(e) =>
                                handleUpdatePreviewCardPrice(idx, parseFloat(e.target.value) || 0)
                              }
                              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs font-bold text-emerald-400 focus:border-sky-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-slate-400 ml-1">zł</span>
                          </td>
                          <td className="px-2 py-2 text-[11px] text-slate-400">
                            {card.foil === 1 ? (
                              <span className="text-amber-300 font-semibold">Foil ✨</span>
                            ) : card.foil === 0 ? (
                              'Non-foil'
                            ) : (
                              'Dowolna'
                            )}
                          </td>
                          <td className="py-2 pr-3 pl-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemovePreviewCard(idx)}
                              className="rounded p-1 text-slate-500 hover:text-red-400"
                              title="Usuń z listy"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary & Confirm Import */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-xs text-slate-400">
                    Szacowany łączny budżet na te karty:{' '}
                    <strong className="text-emerald-400 text-sm">
                      {bulkBuylistPreview
                        .reduce((sum, c) => sum + c.price_pln * c.quantity, 0)
                        .toFixed(2)}{' '}
                      PLN
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setBulkBuylistPreview(null)}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      disabled={bulkBuylistLoading}
                      onClick={handleBulkBuylistImport}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 font-bold text-xs text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {bulkBuylistLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Zapisywanie...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          Zatwierdź i zaimportuj {bulkBuylistPreview.length} kart do skupu
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
