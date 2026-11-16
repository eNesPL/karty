import { NextResponse } from 'next/server';
import { verifyMtgspotSyncRequest } from '@/lib/auth';
import {
  processIncomingMtgspotOffers,
  recordMtgspotSyncError,
  sanitizeIntegrationError,
  validateOffersPayload,
} from '@/lib/mtgspot';

export async function POST(request: Request) {
  try {
    const auth = verifyMtgspotSyncRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Nieprawidłowy format JSON w treści żądania.' },
        { status: 400 }
      );
    }

    const validation = validateOffersPayload(rawBody);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const outcome = processIncomingMtgspotOffers(validation.data);
    if (!outcome.ok) {
      return NextResponse.json({ error: outcome.error }, { status: outcome.status });
    }

    return NextResponse.json({
      success: true,
      upserted_count: outcome.result.upsertedCount,
      marked_unavailable_count: outcome.result.markedUnavailableCount,
      items_processed: outcome.result.itemsProcessed,
    });
  } catch (err: unknown) {
    const sanitized = sanitizeIntegrationError(err);
    try {
      recordMtgspotSyncError(sanitized);
    } catch {
      // ignore secondary error
    }
    return NextResponse.json({ error: sanitized }, { status: 500 });
  }
}
