import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { getDb } from '@/lib/db';
import { Card, BuylistCard } from '@/lib/types';

type CardPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ typ?: string }>;
};

export default function CardDetailPage(props: CardPageProps) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-400 sm:px-6">
          <div className="mx-auto max-w-5xl py-12 text-center text-sm">Ładowanie karty...</div>
        </main>
      }
    >
      <CardDetailContent {...props} />
    </Suspense>
  );
}

async function CardDetailContent({ params, searchParams }: CardPageProps) {
  const { id: rawId } = await params;
  const { typ } = await searchParams;
  const id = Number(rawId);

  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const isBuylist = typ === 'skup';
  const db = getDb();
  const card = isBuylist
    ? (db.prepare('SELECT * FROM buylist_cards WHERE id = ?').get(id) as BuylistCard | undefined)
    : (db.prepare('SELECT * FROM cards WHERE id = ?').get(id) as Card | undefined);

  if (!card) notFound();

  const colors = (() => {
    try {
      const parsed = JSON.parse(card.colors || '[]');
      return Array.isArray(parsed) && parsed.length ? parsed.join(', ') : 'Bez koloru';
    } catch {
      return '—';
    }
  })();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Wróć do katalogu
        </Link>

        <section className="grid gap-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl sm:grid-cols-[minmax(0,340px)_1fr] sm:gap-8 sm:p-6">
          <div className="mx-auto w-full max-w-[340px]">
            <div className="aspect-[5/7] overflow-hidden rounded-xl bg-slate-950 shadow-lg">
              {card.image_url ? (
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center p-6 text-center text-slate-500">
                  {card.name}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${isBuylist ? 'bg-sky-500/15 text-sky-300' : 'bg-amber-500/15 text-amber-300'}`}>
                {isBuylist ? 'Lista skupu' : 'Klaser — na sprzedaż'}
              </span>
              {card.foil === 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-300">
                  <Sparkles className="h-3 w-3" /> Foil
                </span>
              )}
              {isBuylist && card.foil === 2 && (
                <span className="rounded-full bg-sky-500/15 px-3 py-1 text-xs font-bold text-sky-300">
                  Foil lub Non-foil
                </span>
              )}
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{card.name}</h1>
            <p className="mt-2 text-sm text-slate-400">{card.type_line || 'Magic: The Gathering'}</p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {isBuylist ? 'Cena skupu' : 'Cena'}
                </div>
                <div className={`mt-1 text-2xl font-black ${isBuylist ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {Number(card.price_pln).toFixed(2)} zł
                </div>
                {!isBuylist && (card as Card).price_eur != null && (
                  <div className="mt-1 text-xs text-slate-500">Cardmarket: {Number((card as Card).price_eur).toFixed(2)} €</div>
                )}
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {isBuylist ? 'Poszukiwana ilość' : 'Dostępna ilość'}
                </div>
                <div className="mt-1 text-2xl font-black text-white">{card.quantity} szt.</div>
                <div className="mt-1 text-xs text-slate-500">
                  {isBuylist ? `Min. stan: ${(card as BuylistCard).min_condition || 'LP'}` : `Stan: ${(card as Card).condition || 'NM'}`}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h2 className="mb-2 text-sm font-bold text-white">Informacje o wydaniu</h2>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <dt className="text-xs text-slate-500">Dodatek</dt>
                  <dd className="mt-1 font-semibold text-slate-200">{card.set_name || '—'}</dd>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <dt className="text-xs text-slate-500">Kod dodatku / numer karty</dt>
                  <dd className="mt-1 font-semibold uppercase text-slate-200">
                    {card.set_code || '—'}{card.collector_number ? ` #${card.collector_number}` : ''}
                  </dd>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <dt className="text-xs text-slate-500">Rzadkość</dt>
                  <dd className="mt-1 font-semibold capitalize text-slate-200">{card.rarity || '—'}</dd>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <dt className="text-xs text-slate-500">Kolory</dt>
                  <dd className="mt-1 font-semibold text-slate-200">{colors}</dd>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <dt className="text-xs text-slate-500">Koszt many</dt>
                  <dd className="mt-1 font-semibold text-slate-200">{card.mana_cost || '—'}</dd>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <dt className="text-xs text-slate-500">Język</dt>
                  <dd className="mt-1 font-semibold uppercase text-slate-200">{card.language || '—'}</dd>
                </div>
                <div className="rounded-lg bg-slate-950/60 p-3">
                  <dt className="text-xs text-slate-500">Wersja</dt>
                  <dd className="mt-1 font-semibold text-slate-200">
                    {card.foil === 1 ? 'Foil' : card.foil === 0 ? 'Non-foil' : 'Foil / Non-foil'}
                  </dd>
                </div>
                {card.scryfall_id && (
                  <div className="rounded-lg bg-slate-950/60 p-3">
                    <dt className="text-xs text-slate-500">Scryfall ID</dt>
                    <dd className="mt-1 break-all font-mono text-xs text-slate-300">{card.scryfall_id}</dd>
                  </div>
                )}
              </dl>
            </div>

            {isBuylist && (card as BuylistCard).notes && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Uwagi do skupu</h2>
                <p className="mt-1 text-sm text-slate-300">{(card as BuylistCard).notes}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
