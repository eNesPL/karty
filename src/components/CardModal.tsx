'use client';

import React from 'react';
import { Card, BuylistCard } from '@/lib/types';
import { X, Sparkles, HandCoins } from 'lucide-react';

interface CardModalProps {
  card: Card | BuylistCard | null;
  mode?: 'sell' | 'buy';
  onClose: () => void;
  onAddToCart?: (card: Card) => void;
  onAddToOffer?: (card: BuylistCard) => void;
}

export function CardModal({ card, mode = 'sell', onClose, onAddToCart, onAddToOffer }: CardModalProps) {
  if (!card) return null;

  const isBuylist = mode === 'buy' || 'min_condition' in card;
  const buylistCard = isBuylist ? (card as BuylistCard) : null;
  const sellCard = !isBuylist ? (card as Card) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-sm w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/80 text-slate-300 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative aspect-[5/7] w-full overflow-hidden rounded-xl bg-slate-950 shadow-inner">
          {card.image_url ? (
            <img
              src={card.image_url}
              alt={card.name}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-500">
              {card.name}
            </div>
          )}
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{card.name}</h2>
            {card.foil === 1 && (
              <span className="flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-300">
                <Sparkles className="h-3 w-3" /> Foil
              </span>
            )}
            {isBuylist && card.foil === 2 && (
              <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                Foil / Normal
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-slate-400">
            {card.type_line || 'Magic: The Gathering'}
          </p>

          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
              Stan: <strong className="text-white">
                {isBuylist ? `Min. ${buylistCard?.min_condition || 'LP'}` : sellCard?.condition || 'NM'}
              </strong>
            </span>
            {card.set_name && (
              <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                Dodatek: <strong className="text-white">{card.set_name}</strong>
              </span>
            )}
            <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
              {isBuylist ? 'Poszukiwane:' : 'Dostępne:'}{' '}
              <strong className="text-white">{card.quantity} szt.</strong>
            </span>
          </div>

          {buylistCard?.notes && (
            <p className="mt-2 text-xs text-slate-400 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              Uwagi skupu: {buylistCard.notes}
            </p>
          )}

          <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-400">
                {isBuylist ? 'Oferowana cena skupu:' : 'Cena:'}
              </div>
              <div className={`text-xl font-extrabold ${isBuylist ? 'text-emerald-400' : 'text-amber-400'}`}>
                {card.price_pln.toFixed(2)} PLN
              </div>
              {!isBuylist && sellCard?.price_eur && (
                <div className="text-xs text-slate-500">
                  Cardmarket ~{sellCard.price_eur.toFixed(2)} €
                </div>
              )}
            </div>

            {isBuylist ? (
              <button
                onClick={() => {
                  if (onAddToOffer && buylistCard) onAddToOffer(buylistCard);
                  onClose();
                }}
                type="button"
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 font-bold text-sm text-white transition hover:bg-sky-500"
              >
                <HandCoins className="h-4 w-4" />
                Mam tę kartę
              </button>
            ) : (
              <button
                onClick={() => {
                  if (onAddToCart && sellCard) onAddToCart(sellCard);
                  onClose();
                }}
                type="button"
                className="rounded-lg bg-amber-500 px-4 py-2 font-bold text-sm text-slate-950 transition hover:bg-amber-400"
              >
                Dodaj do rezerwacji
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
