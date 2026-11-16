import { NextResponse } from 'next/server';
import { verifyMtgspotSyncRequest } from '@/lib/auth';
import { getMtgspotIntegrationStatus, sanitizeIntegrationError } from '@/lib/mtgspot';

export async function GET(request: Request) {
  try {
    const auth = verifyMtgspotSyncRequest(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const status = getMtgspotIntegrationStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeIntegrationError(err) },
      { status: 500 }
    );
  }
}
