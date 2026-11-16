import { NextResponse } from 'next/server';
import { getAdminPasswordHeader, verifyAdminPassword } from '@/lib/auth';
import {
  getAdminMtgspotOffersOverview,
  recordMtgspotSyncError,
  sanitizeIntegrationError,
} from '@/lib/mtgspot';

export async function POST(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const scraperApiUrl = process.env.MTGSPOT_SCRAPER_API_URL?.trim();
    const syncToken = process.env.MTGSPOT_SYNC_TOKEN?.trim();

    let remoteMessage: string | null = null;

    if (scraperApiUrl && syncToken) {
      const targetUrl = `${scraperApiUrl.replace(/\/+$/, '')}/api/integrations/karty/sync`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      try {
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${syncToken}`,
            Accept: 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const text = await res.text();
          const errMsg = sanitizeIntegrationError(
            `Scraper zwrócił błąd HTTP ${res.status}: ${text.slice(0, 200)}`
          );
          recordMtgspotSyncError(errMsg);
          return NextResponse.json(
            {
              error: errMsg,
              overview: getAdminMtgspotOffersOverview(),
            },
            { status: 502 }
          );
        }

        try {
          const scraperJson = (await res.json()) as {
            status?: string;
            message?: string;
            wantlist_fetched?: number;
            items_checked?: number;
            offers_found?: number;
          };
          if (scraperJson.status === 'already_running') {
            const checked = scraperJson.items_checked ?? 0;
            const total = scraperJson.wantlist_fetched ?? 0;
            const progressStr = total > 0 ? ` (${checked}/${total} poz.)` : '';
            remoteMessage = `Synchronizacja w tle już trwa w MTGSpot Scraper${progressStr} — dane aktualizują się na bieżąco.`;
          } else if (scraperJson.status === 'disabled') {
            remoteMessage = 'Integracja po stronie MTGSpot Scraper jest wyłączona (brak KARTY_API_URL / KARTY_SYNC_TOKEN w scraperze).';
          } else if (typeof scraperJson.items_checked === 'number') {
            remoteMessage = `Synchronizacja z MTGSpot Scraper wykonana pomyślnie (sprawdzono ${scraperJson.items_checked} poz., znaleziono ${scraperJson.offers_found ?? 0} ofert).`;
          }
        } catch {
          // ignore JSON parse issues if body is empty
        }
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const errMsg = sanitizeIntegrationError(
          `Nie udało się połączyć ze scraperem MTGSpot: ${err instanceof Error ? err.message : String(err)}`
        );
        recordMtgspotSyncError(errMsg);
        return NextResponse.json(
          {
            error: errMsg,
            overview: getAdminMtgspotOffersOverview(),
          },
          { status: 502 }
        );
      }
    }

    const overview = getAdminMtgspotOffersOverview();
    return NextResponse.json({
      success: true,
      triggered_remote: Boolean(scraperApiUrl && syncToken),
      message:
        remoteMessage ||
        (scraperApiUrl && syncToken
          ? 'Synchronizacja z MTGSpot Scraper wykonana pomyślnie.'
          : 'Odświeżono dane ofert. Scraper synchronizuje dane cyklicznie w tle.'),
      overview,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeIntegrationError(err) },
      { status: 500 }
    );
  }
}
