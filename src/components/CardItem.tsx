'use client';

import React from 'react';
import { Card } from '@/lib/types';
import { Plus, Minus, Check, Sparkles, Eye } from 'lucide-react';

interface CardItemProps {
  card: Card;
  cartQuantity: number;
  onAddToCart: (card: Card) => void;
  onRemoveFromCart: (cardId: number) => void;
  onPreview: (card: Card) => void;
}

const RARITY_MAP: Record<string, { label: string; badgeClass: string }> = {
  mythic: { label: 'Mythic', badgeClass: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  rare: { label: 'Rare', badgeClass: 'bg-amber-400/20 text-amber-300 border border-amber-400/30' },
  uncommon: { label: 'Uncommon', badgeClass: 'bg-slate-300/20 text-slate-300 border border-slate-300/30' },
  common: { label: 'Common', badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700/50' },
};

export function CardItem({
  card,
  cartQuantity,
  onAddToCart,
  onRemoveFromCart,
  onPreview,
}: CardItemProps) {
  const isOutOfStock = card.quantity <= 0;
  const isMaxInCart = cartQuantity >= card.quantity;

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-xl border bg-slate-900/90 p-3 shadow-md transition-all hover:border-amber-500/50 hover:shadow-xl ${
        card.foil
          ? 'border-amber-400/40 bg-gradient-to-b from-slate-900 to-amber-950/20 shadow-amber-500/5'
          : 'border-slate-800'
      }`}
    >
      {/* Foil shimmer tag */}
      {card.foil === 1 && (
        <div className="absolute -top-2.5 right-3 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-950 shadow-md">
          <Sparkles className="h-3 w-3" />
          FOIL
        </div>
      )}

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
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/80 text-slate-200 backdrop-blur-sm transition-opacity hover:bg-amber-500 hover:text-slate-950 md:opacity-0 md:group-hover:opacity-100"
          title="Powiększ kartę"
        >
          <Eye className="h-4 w-4" />
        </button>

        {/* Condition Badge */}
        <div className="absolute top-2 left-2 rounded bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-300 backdrop-blur-sm">
          {card.condition || 'NM'}
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

          {card.type_line && (
            <p className="line-clamp-1 text-[11px] text-slate-400 mt-0.5" title={card.type_line}>
              {card.type_line}
            </p>
          )}

          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            {card.set_code && (
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono uppercase text-[10px] text-slate-300">
                {card.set_code}
                {card.collector_number ? ` #${card.collector_number}` : ''}
              </span>
            )}
            {card.rarity && (
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  RARITY_MAP[card.rarity.toLowerCase()]?.badgeClass || 'bg-slate-800 text-slate-400'
                }`}
                title={`Rzadkość: ${card.rarity}`}
              >
                {card.rarity.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="text-[11px] text-slate-400 ml-auto">
              {card.quantity > 0 ? `${card.quantity} szt.` : 'Brak'}
            </span>
          </div>
        </div>

        {/* Price & Action */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
          <div>
            <div className="text-base font-bold text-amber-400">
              {card.price_pln.toFixed(2)}{' '}
              <span className="text-xs font-normal text-amber-400/80">PLN</span>
            </div>
            {card.price_eur && (
              <div className="text-[10px] text-slate-500">
                ~{card.price_eur.toFixed(2)} €
              </div>
            )}
          </div>

          {/* Cart Stepper / Add Button */}
          {isOutOfStock ? (
            <span className="rounded bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-500">
              Zajęta
            </span>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center rounded-lg border border-amber-500/40 bg-amber-500/10 p-0.5">
              <button
                type="button"
                onClick={() => onRemoveFromCart(card.id)}
                className="flex h-7 w-7 items-center justify-center rounded text-amber-300 hover:bg-amber-500/20 active:scale-95"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-amber-200">
                {cartQuantity}
              </span>
              <button
                type="button"
                disabled={isMaxInCart}
                onClick={() => onAddToCart(card)}
                className={`flex h-7 w-7 items-center justify-center rounded text-amber-300 hover:bg-amber-500/20 active:scale-95 ${
                  isMaxInCart ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(card)}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm transition-all hover:bg-amber-400 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Rezerwuj
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
