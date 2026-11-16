import crypto from 'node:crypto';
import { getDb } from '@/lib/db';

export function verifyAdminPassword(providedPassword: string | null): boolean {
  if (!providedPassword) return false;
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password') as { value: string } | undefined;
  if (row?.value) {
    return providedPassword.trim() === row.value.trim();
  }
  const pinRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_pin') as { value: string } | undefined;
  const currentPassword = pinRow?.value || 'haslo';
  return providedPassword.trim() === currentPassword.trim();
}

export function verifyAdminPin(providedPin: string | null): boolean {
  return verifyAdminPassword(providedPin);
}

export function getAdminPasswordHeader(request: Request): string | null {
  return request.headers.get('x-admin-password') || request.headers.get('x-admin-pin');
}

export function timingSafeTokenCompare(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedHash = crypto.createHash('sha256').update(providedBuf).digest();
  const expectedHash = crypto.createHash('sha256').update(expectedBuf).digest();
  const hashesEqual = crypto.timingSafeEqual(providedHash, expectedHash);
  return hashesEqual && providedBuf.length === expectedBuf.length;
}

export function extractSyncTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  const customHeader = request.headers.get('x-sync-token');
  if (customHeader && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

export interface SyncAuthResult {
  authorized: boolean;
  status: number;
  error?: string;
}

export function verifyMtgspotSyncRequest(request: Request): SyncAuthResult {
  // Enforce HTTPS in production environment
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_INTEGRATION_HTTP !== 'true') {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim().toLowerCase();
    let protocol = forwardedProto;
    if (!protocol) {
      try {
        protocol = new URL(request.url).protocol.replace(':', '').toLowerCase();
      } catch {
        protocol = 'http';
      }
    }
    if (protocol !== 'https') {
      return {
        authorized: false,
        status: 403,
        error: 'Wymagane połączenie HTTPS w środowisku produkcyjnym.',
      };
    }
  }

  const expectedToken = process.env.MTGSPOT_SYNC_TOKEN?.trim() || '';
  if (!expectedToken) {
    return {
      authorized: false,
      status: 403,
      error: 'Integracja MTGSpot nie jest skonfigurowana (brak MTGSPOT_SYNC_TOKEN).',
    };
  }

  const providedToken = extractSyncTokenFromRequest(request);
  if (!providedToken) {
    return {
      authorized: false,
      status: 401,
      error: 'Brak tokenu autoryzacyjnego (wymagany nagłówek Authorization: Bearer).',
    };
  }

  if (!timingSafeTokenCompare(providedToken, expectedToken)) {
    return {
      authorized: false,
      status: 403,
      error: 'Nieprawidłowy token integracyjny.',
    };
  }

  return { authorized: true, status: 200 };
}
