'use client';

import React, { useState } from 'react';
import { BuylistCard } from '@/lib/types';
import { X, Trash2, Plus, Minus, CheckCircle, Calendar, Sparkles, HandCoins } from 'lucide-react';

export interface BuylistOfferItemState {
  card: BuylistCard;
  quantity: number;
  condition: string;
  foil: number;
}

interface BuylistOfferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: BuylistOfferItemState[];
  onUpdateQuantity: (cardId: number, qty: number) => void;
  onUpdateCondition: (cardId: number, condition: string) => void;
  onUpdateFoil: (cardId: number, foil: number) => void;
  onRemoveItem: (cardId: number) => void;
  onClearOffer: () => void;
  pickupDays: string[];
  onOfferSuccess: () => void;
}

export function BuylistOfferDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onUpdateCondition,
  onUpdateFoil,
  onRemoveItem,
  onClearOffer,
  pickupDays,
  onOfferSuccess,
}: BuylistOfferDrawerProps) {
  const [sellerName, setSellerName] = useState('');
  const [sellerContact, setSellerContact] = useState('');
  const [meetingDay, setMeetingDay] = useState(pickupDays[0] || 'Wtorek');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ id: number; total: number } | null>(null);

  if (!isOpen) return null;

  const totalPayout = items.reduce((sum, item) => sum + item.card.price_pln * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!sellerName.trim() || !sellerContact.trim() || !meetingDay) {
      setErrorMsg('Wypełnij wszystkie wymagane pola (Imię/Nick, Kontakt, Dzień spotkania).');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Nie wybrano żadnych kart do zaoferowania.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/buylist/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seller_name: sellerName.trim(),
          seller_contact: sellerContact.trim(),
          meeting_day: meetingDay.trim(),
          notes: notes.trim(),
          items: items.map((i) => ({
            buylist_card_id: i.card.id,
            quantity: i.quantity,
            condition: i.condition,
            foil: i.foil,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nie udało się wysłać oferty.');
      }

      setSuccessInfo({ id: data.offer_id, total: data.total_payout_pln });
      onClearOffer();
      onOfferSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSuccessInfo(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleResetAndClose}
    >
      <div
        className="relative flex h-full w-full max-w-md flex-col bg-slate-900 border-l border-slate-800 shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HandCoins className="h-5 w-5 text-sky-400" />
              Oferta Sprzedaży (Skup)
            </h2>
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-300">
              {items.reduce((acc, i) => acc + i.quantity, 0)} szt.
            </span>
          </div>
          <button
            onClick={handleResetAndClose}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {successInfo ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-white">Oferta sprzedaży wysłana!</h3>
            <p className="mt-2 text-sm text-slate-300">
              Właściciel otrzymał Twoje zgłoszenie. Przynieś karty w <strong className="text-sky-400">{meetingDay}</strong> lub poczekaj na kontakt.
            </p>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 w-full">
              <div className="flex justify-between py-1">
                <span>Numer oferty:</span>
                <strong className="text-slate-200">#{successInfo.id}</strong>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-900">
                <span>Łącznie do wypłaty dla Ciebie:</span>
                <strong className="text-emerald-400 text-sm font-bold">{successInfo.total.toFixed(2)} PLN</strong>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-900">
                <span>Zgłaszający:</span>
                <strong className="text-slate-200">{sellerName}</strong>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              type="button"
              className="mt-6 w-full rounded-xl bg-sky-600 py-3 font-bold text-white shadow-md transition hover:bg-sky-500"
            >
              Wróć do listy kart
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-400">
            <HandCoins className="h-12 w-12 text-slate-600 mb-2" />
            <p className="text-base font-medium text-slate-300">Lista oferowanych kart jest pusta.</p>
            <p className="mt-1 text-xs text-slate-500 max-w-xs">
              Przejrzyj listę poszukiwanych kart w zakładce „Skup / Kupię” i kliknij „Mam tę kartę”, aby zaoferować jej sprzedaż.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map(({ card, quantity, condition, foil }) => (
                <div
                  key={card.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-slate-900">
                      {card.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[8px] text-slate-600">
                          MTG
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="truncate text-sm font-semibold text-slate-200" title={card.name}>
                          {card.name}
                        </h4>
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {card.set_code?.toUpperCase()} • Szuka do: {card.quantity} szt.
                      </div>
                      <div className="mt-1 text-sm font-bold text-emerald-400">
                        {(card.price_pln * quantity).toFixed(2)} PLN
                        {quantity > 1 && (
                          <span className="text-[10px] font-normal text-slate-400 ml-1">
                            ({card.price_pln.toFixed(2)}/szt.)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(card.id, quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-slate-200">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= card.quantity}
                          onClick={() => onUpdateQuantity(card.id, quantity + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(card.id)}
                        className="p-1 text-slate-500 hover:text-red-400 transition"
                        title="Usuń"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Condition & Foil selection for this card */}
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-900 pt-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400">Stan Twojej karty:</span>
                      <select
                        value={condition}
                        onChange={(e) => onUpdateCondition(card.id, e.target.value)}
                        className="rounded border border-slate-800 bg-slate-900 px-1.5 py-0.5 text-slate-200 text-xs focus:outline-none"
                      >
                        <option value="NM">NM (Near Mint)</option>
                        <option value="LP/EX">LP / EX</option>
                        <option value="MP">MP (Played)</option>
                        <option value="HP">HP (Heavily Played)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateFoil(card.id, foil === 1 ? 0 : 1)}
                        className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium border transition ${
                          foil === 1
                            ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        Foil
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Seller Form */}
            <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-950/90 p-5 space-y-3">
              {errorMsg && (
                <div className="rounded-lg bg-red-950/50 border border-red-800/80 p-2.5 text-xs text-red-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Twoje Imię / Nick <span className="text-sky-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Tomek 'MagicPlayer'"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kontakt (Discord / tel / fb) <span className="text-sky-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Discord: tomek#5678 lub tel. 600 789 012"
                  value={sellerContact}
                  onChange={(e) => setSellerContact(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kiedy przyniesiesz karty? <span className="text-sky-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {pickupDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setMeetingDay(day)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        meetingDay === day
                          ? 'border-sky-500 bg-sky-500/10 text-sky-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dodatkowe uwagi (opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. karty są w koszulkach Dragon Shield"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Total & Submit */}
              <div className="pt-2">
                <div className="flex items-center justify-between py-2 text-base font-bold text-white">
                  <span>Do wypłaty dla Ciebie:</span>
                  <span className="text-xl text-emerald-400 font-extrabold">{totalPayout.toFixed(2)} PLN</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 py-3 font-bold text-white shadow-lg shadow-sky-600/20 transition hover:from-sky-500 hover:to-blue-500 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? 'Wysyłanie oferty...' : `Wyślij ofertę sprzedaży (${totalPayout.toFixed(2)} PLN)`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
