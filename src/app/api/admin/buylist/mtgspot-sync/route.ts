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

    if (scraperApiUrl && syncToken) {
      const targetUrl = `${scraperApiUrl.replace(/\/+$/, '')}/api/integrations/karty/sync`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
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
        scraperApiUrl && syncToken
          ? 'Synchronizacja z MTGSpot Scraper wykonana pomyślnie.'
          : 'Odświeżono dane ofert. Scraper synchronizuje dane cyklicznie w tle.',
      overview,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeIntegrationError(err) },
      { status: 500 }
    );
  }
}
