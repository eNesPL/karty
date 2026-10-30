import { NextResponse } from 'next/server';
import { verifyAdminPassword, getAdminPasswordHeader } from '@/lib/auth';
import { testDiscordWebhook } from '@/lib/discord';

export async function POST(request: Request) {
  try {
    const password = getAdminPasswordHeader(request);
    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: 'Brak uprawnień (niepoprawne hasło).' }, { status: 401 });
    }

    const { webhookUrl } = await request.json();
    const result = await testDiscordWebhook(webhookUrl);

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
