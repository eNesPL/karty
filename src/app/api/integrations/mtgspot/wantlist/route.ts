import { NextResponse } from 'next/server';
import { verifyMtgspotSyncRequest } from '@/lib/auth';
import { getActiveMtgspotWantlist, sanitizeIntegrationError } from '@/lib/mtgspot';

export async function GET(request: Request) {
  try {
    const auth = verifyMtgspotSyncRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const items = getActiveMtgspotWantlist();
    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeIntegrationError(err) },
      { status: 500 }
    );
  }
}
