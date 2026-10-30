import { getDb } from '@/lib/db';

export function verifyAdminPin(providedPin: string | null): boolean {
  if (!providedPin) return false;
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_pin') as { value: string } | undefined;
  const currentPin = row?.value || '1234';
  return providedPin.trim() === currentPin.trim();
}
