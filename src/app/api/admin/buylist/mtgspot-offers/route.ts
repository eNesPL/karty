import { NextResponse } from 'next/server';
import { getAdminPasswordHeader, verifyAdminPassword } from '@/lib/auth';
import { getAdminMtgspotOffersOverview, sanitizeIntegrationError } from '@/lib/mtgspot';

export async function GET(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const overview = getAdminMtgspotOffersOverview();
    return NextResponse.json(overview);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: sanitizeIntegrationError(err) },
      { status: 500 }
    );
  }
}
