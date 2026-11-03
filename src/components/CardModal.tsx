'use client';

import React, { useEffect, useState } from 'react';
import { Card, BuylistCard } from '@/lib/types';
import { ScryfallCardData } from '@/lib/scryfall';
import { X, Sparkles, HandCoins, RefreshCw, Layers } from 'lucide-react';

interface CardModalProps {
  card: Card | BuylistCard | null;
  mode?: 'sell' | 'buy';
  onClose: () => void;
  onAddToCart?: (card: Card) => void;
  onAddToOffer?: (card: BuylistCard) => void;
}

export function CardModal({ card, mode = 'sell', onClose, onAddToCart, onAddToOffer }: CardModalProps) {
  const isBuylist = !!card && (mode === 'buy' || 'min_condition' in card);
  const buylistCard = isBuylist ? (card as BuylistCard) : null;
  const sellCard = card && !isBuylist ? (card as Card) : null;

  const [printings, setPrintings] = useState<ScryfallCardData[]>([]);
  const [printingsLoading, setPrintingsLoading] = useState(false);
  const [printingsError, setPrintingsError] = useState('');
  const [enlargedImage, setEnlargedImage] = useState<{ url: string; alt: string } | null>(null);

  useEffect(() => {
    if (!buylistCard) {
      setPrintings([]);
      setPrintingsError('');
      setPrintingsLoading(false);
      return;
    }

    const controller = new AbortController();
    setPrintingsLoading(true);
    setPrintingsError('');
    setPrintings([]);

    fetch(`/api/buylist/printings?name=${encodeURIComponent(buylistCard.name)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Nie udało się pobrać wydań karty.');
        return data;
      })
      .then((data) => setPrintings(Array.isArray(data.printings) ? data.printings : []))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === 'AbortError') return;
        setPrintingsError(error instanceof Error ? error.message : 'Nie udało się pobrać wydań karty.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setPrintingsLoading(false);
      });

    return () => controller.abort();
  }, [buylistCard?.id, buylistCard?.name]);

  if (!card) return null;

  const currentPrinting = (printing: ScryfallCardData) =>
    printing.set.toLowerCase() === (card.set_code || '').toLowerCase() &&
    printing.collector_number === (card.collector_number || '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-2xl w-full overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/80 text-slate-300 hover:text-white"
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </button>

        <div className={`grid gap-4 ${isBuylist ? 'sm:grid-cols-[minmax(0,220px)_1fr]' : 'sm:grid-cols-[minmax(0,220px)_1fr]'}`}>
          <div className="relative mx-auto aspect-[5/7] w-full max-w-[220px] overflow-hidden rounded-xl bg-slate-950 shadow-inner">
            {card.image_url ? (
              <button
                type="button"
                onClick={() => setEnlargedImage({ url: card.image_url!, alt: card.name })}
                className="h-full w-full cursor-zoom-in"
                aria-label={`Powiększ ${card.name}`}
              >
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="h-full w-full object-contain"
                />
              </button>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-500">
                {card.name}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 pr-8">
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
              {card.set_code && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300">
                  Kod: <strong className="text-white">{card.set_code.toUpperCase()}</strong>
                  {card.collector_number ? ` #${card.collector_number}` : ''}
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

        {enlargedImage && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 p-4"
            onClick={() => setEnlargedImage(null)}
          >
            <button
              type="button"
              onClick={() => setEnlargedImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-slate-800/90 p-2 text-white hover:bg-slate-700"
              aria-label="Zamknij powiększenie"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={enlargedImage.url}
              alt={enlargedImage.alt}
              onClick={(event) => event.stopPropagation()}
              className="max-h-[92vh] max-w-[92vw] cursor-zoom-out object-contain"
            />
          </div>
        )}

        {isBuylist && (
          <section className="mt-5 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">Pozostałe printy i edycje</h3>
              {!printingsLoading && printings.length > 0 && (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                  {printings.length}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Wszystkie wydania tej karty znalezione w Scryfall. Cena skupu powyżej dotyczy pozycji z listy skupu.
            </p>

            {printingsLoading ? (
              <div className="flex items-center gap-2 py-5 text-xs text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin text-sky-400" />
                Pobieranie wszystkich wydań z Scryfall...
              </div>
            ) : printingsError ? (
              <div className="mt-3 rounded-lg border border-red-900/60 bg-red-950/30 p-3 text-xs text-red-300">
                {printingsError}
                <button
                  type="button"
                  onClick={() => {
                    setPrintingsError('');
                    setPrintingsLoading(true);
                    fetch(`/api/buylist/printings?name=${encodeURIComponent(card.name)}`, { cache: 'no-store' })
                      .then(async (response) => {
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || 'Nie udało się pobrać wydań karty.');
                        return data;
                      })
                      .then((data) => setPrintings(Array.isArray(data.printings) ? data.printings : []))
                      .catch((error: unknown) => setPrintingsError(error instanceof Error ? error.message : 'Nie udało się pobrać wydań karty.'))
                      .finally(() => setPrintingsLoading(false));
                  }}
                  className="ml-2 font-semibold underline"
                >
                  Spróbuj ponownie
                </button>
              </div>
            ) : printings.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">Nie znaleziono innych wydań tej karty.</p>
            ) : (
              <>
              <div
                className="mt-3 flex max-h-80 gap-3 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-3"
                aria-label="Lista printów — przesuwaj w lewo lub w prawo"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
              >
                {printings.map((printing) => {
                  const isCurrent = currentPrinting(printing);
                  return (
                    <article
                      key={printing.id}
                      className={`flex w-[230px] flex-shrink-0 snap-start flex-col rounded-xl border p-3 ${isCurrent ? 'border-sky-500/70 bg-sky-500/10' : 'border-slate-800 bg-slate-950/60'}`}
                    >
                      <div className="flex gap-3">
                        <div className="h-[126px] w-[90px] flex-shrink-0 overflow-hidden rounded-lg bg-slate-900">
                          {printing.image_url ? (
                            <button
                              type="button"
                              onClick={() => setEnlargedImage({ url: printing.image_url!, alt: `${printing.name} — ${printing.set_name}` })}
                              className="h-full w-full cursor-zoom-in"
                              aria-label={`Powiększ print: ${printing.set_name}`}
                            >
                              <img
                                src={printing.image_url}
                                alt={`${printing.name} — ${printing.set_name}`}
                                loading="lazy"
                                className="h-full w-full object-contain"
                              />
                            </button>
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-slate-600">MTG</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Dodatek / edycja</div>
                          <div className="mt-1 break-words text-xs font-bold leading-snug text-white">
                            {printing.set_name}
                          </div>
                          <div className="mt-2 text-[10px] text-slate-400">
                            Kod edycji: <strong className="text-slate-200">{printing.set.toUpperCase()}</strong>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-400">
                            Numer karty: <strong className="text-slate-200">#{printing.collector_number}</strong>
                          </div>
                          <div className="mt-1 text-[10px] capitalize text-slate-400">
                            Rzadkość: <strong className="text-slate-200">{printing.rarity || '—'}</strong>
                          </div>
                        </div>
                      </div>
                      {isCurrent && (
                        <span className="mt-3 self-start rounded bg-sky-500/20 px-2 py-1 text-[9px] font-bold text-sky-300">
                          Pozycja skupu
                        </span>
                      )}
                    </article>
                  );
                })}
              </div>
              <p className="mt-1 text-center text-[10px] text-slate-500 sm:hidden">
                Przesuń palcem w bok, aby zobaczyć kolejne printy →
              </p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
