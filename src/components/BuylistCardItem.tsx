'use client';

import React from 'react';
import { BuylistCard } from '@/lib/types';
import { Plus, Minus, Sparkles, Eye, HandCoins } from 'lucide-react';

interface BuylistCardItemProps {
  card: BuylistCard;
  offerQuantity: number;
  onAddToOffer: (card: BuylistCard) => void;
  onRemoveFromOffer: (cardId: number) => void;
  onPreview: (card: BuylistCard) => void;
}

export function BuylistCardItem({
  card,
  offerQuantity,
  onAddToOffer,
  onRemoveFromOffer,
  onPreview,
}: BuylistCardItemProps) {
  const isMaxInOffer = offerQuantity >= card.quantity;

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-sky-900/60 bg-slate-900/90 p-3 shadow-md transition-all hover:border-sky-500/50 hover:shadow-xl">
      {/* Buylist tag */}
      <div className="absolute -top-2.5 right-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white shadow-md">
        <HandCoins className="h-3 w-3" />
        SKUP
      </div>

      {/* Card Image Container */}
      <div className="relative aspect-[5/7] w-full overflow-hidden rounded-lg bg-slate-950">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={card.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-4 text-center text-xs text-slate-500">
            {card.name}
          </div>
        )}

        {/* Quick Zoom Button */}
        <button
          onClick={() => onPreview(card)}
          type="button"
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/80 text-slate-200 backdrop-blur-sm transition-opacity hover:bg-sky-500 hover:text-slate-950 md:opacity-0 md:group-hover:opacity-100"
          title="Zobacz kartę i inne printy" aria-label="Zobacz kartę i inne printy"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Min Condition Badge */}
        <div className="absolute top-2 left-2 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-sky-300 backdrop-blur-sm border border-sky-800/50">
          Min. {card.min_condition || 'LP'}
        </div>
      </div>

      {/* Card Details */}
      <div className="mt-3 flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1">
            <h3 className="line-clamp-1 font-semibold text-slate-100 text-sm" title={card.name}>
              {card.name}
            </h3>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            {card.set_code && (
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono uppercase text-[10px] text-slate-300">
                {card.set_code}
                {card.collector_number ? ` #${card.collector_number}` : ''}
              </span>
            )}
            <span className="text-[11px] text-sky-400/90 font-medium">
              Szukam: {card.quantity} szt.
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
            {card.foil === 1 ? (
              <span className="flex items-center gap-0.5 text-amber-300">
                <Sparkles className="h-2.5 w-2.5" /> Tylko Foil
              </span>
            ) : card.foil === 0 ? (
              <span className="text-slate-400">Tylko Non-foil</span>
            ) : (
              <span className="text-slate-400">Dowolna (Foil / Normal)</span>
            )}
          </div>

          {card.notes && (
            <p className="mt-1.5 line-clamp-1 text-[10px] text-slate-400 italic bg-slate-950/50 rounded px-1.5 py-0.5">
              &quot;{card.notes}&quot;
            </p>
          )}
        </div>

        {/* Payout & Action */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Płacę:
            </div>
            <div className="text-base font-bold text-emerald-400">
              {card.price_pln.toFixed(2)}{' '}
              <span className="text-xs font-normal text-emerald-400/80">PLN</span>
            </div>
          </div>

          {/* Stepper / Add Button */}
          {offerQuantity > 0 ? (
            <div className="flex items-center rounded-lg border border-sky-500/40 bg-sky-500/10 p-0.5">
              <button
                type="button"
                onClick={() => onRemoveFromOffer(card.id)}
                className="flex h-7 w-7 items-center justify-center rounded text-sky-300 hover:bg-sky-500/20 active:scale-95"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-sky-200">
                {offerQuantity}
              </span>
              <button
                type="button"
                disabled={isMaxInOffer}
                onClick={() => onAddToOffer(card)}
                className={`flex h-7 w-7 items-center justify-center rounded text-sky-300 hover:bg-sky-500/20 active:scale-95 ${
                  isMaxInOffer ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToOffer(card)}
              className="flex items-center gap-1 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-sky-500 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Mam tę kartę
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
