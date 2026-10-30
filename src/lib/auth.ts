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

