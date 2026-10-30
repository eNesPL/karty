'use client';

import React, { useState } from 'react';
import { Card } from '@/lib/types';
import { X, Trash2, Plus, Minus, CheckCircle, Calendar, Sparkles } from 'lucide-react';

export interface CartItem {
  card: Card;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (cardId: number, qty: number) => void;
  onRemoveItem: (cardId: number) => void;
  onClearCart: () => void;
  pickupDays: string[];
  onReservationSuccess: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  pickupDays,
  onReservationSuccess,
}: CartDrawerProps) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [pickupDay, setPickupDay] = useState(pickupDays[0] || 'Wtorek');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successInfo, setSuccessInfo] = useState<{ id: number; total: number } | null>(null);

  if (!isOpen) return null;

  const totalPrice = items.reduce((sum, item) => sum + item.card.price_pln * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!buyerName.trim() || !buyerContact.trim() || !pickupDay) {
      setErrorMsg('Wypełnij wszystkie wymagane pola (Imię/Nick, Kontakt, Dzień odbioru).');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Twój koszyk jest pusty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: buyerName.trim(),
          buyer_contact: buyerContact.trim(),
          pickup_day: pickupDay.trim(),
          notes: notes.trim(),
          items: items.map((i) => ({
            card_id: i.card.id,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nie udało się zarezerwować kart.');
      }

      setSuccessInfo({ id: data.reservation_id, total: data.total_price_pln });
      onClearCart();
      onReservationSuccess();
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
            <h2 className="text-lg font-bold text-white">Koszyk Rezerwacji</h2>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
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
            <h3 className="mt-4 text-xl font-bold text-white">Rezerwacja potwierdzona!</h3>
            <p className="mt-2 text-sm text-slate-300">
              Karty zostały dla Ciebie odłożone na <strong className="text-amber-400">{pickupDay}</strong>.
            </p>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 w-full">
              <div className="flex justify-between py-1">
                <span>Numer rezerwacji:</span>
                <strong className="text-slate-200">#{successInfo.id}</strong>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-900">
                <span>Do zapłaty na miejscu:</span>
                <strong className="text-amber-400 text-sm">{successInfo.total.toFixed(2)} PLN</strong>
              </div>
              <div className="flex justify-between py-1 border-t border-slate-900">
                <span>Odbierający:</span>
                <strong className="text-slate-200">{buyerName}</strong>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              type="button"
              className="mt-6 w-full rounded-xl bg-amber-500 py-3 font-bold text-slate-950 shadow-md transition hover:bg-amber-400"
            >
              Wróć do przeglądania kart
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-400">
            <p className="text-base font-medium">Twój koszyk jest pusty.</p>
            <p className="mt-1 text-xs text-slate-500">
              Wybierz karty z listy i kliknij „Rezerwuj”, aby je tutaj dodać.
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {items.map(({ card, quantity }) => (
                <div
                  key={card.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5"
                >
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
                      {card.foil === 1 && (
                        <Sparkles className="h-3 w-3 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {card.condition} • {card.set_code?.toUpperCase()}
                    </div>
                    <div className="mt-1 text-sm font-bold text-amber-400">
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
              ))}
            </div>

            {/* Checkout Form */}
            <form onSubmit={handleSubmit} className="border-t border-slate-800 bg-slate-950/90 p-5 space-y-3">
              {errorMsg && (
                <div className="rounded-lg bg-red-950/50 border border-red-800/80 p-2.5 text-xs text-red-300">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Twoje Imię / Nick <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Michał 'Kozioł'"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Kontakt (Discord / tel / fb) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Discord: koziol#1234 lub tel. 500 123 456"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dzień odbioru <span className="text-amber-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {pickupDays.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setPickupDay(day)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                        pickupDay === day
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold'
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
                  Uwagi (opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. będę po 18:30"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Total & Submit */}
              <div className="pt-2">
                <div className="flex items-center justify-between py-2 text-base font-bold text-white">
                  <span>Łączna kwota:</span>
                  <span className="text-xl text-amber-400">{totalPrice.toFixed(2)} PLN</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] disabled:opacity-50"
                >
                  {isSubmitting ? 'Rezerwowanie...' : `Potwierdź rezerwację (${totalPrice.toFixed(2)} PLN)`}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
