import 'server-only';
import { timingSafeEqual } from 'node:crypto';
import { hashPassword, verifyPassword } from './password';

function credentials() {
  const username = process.env.ADMIN_USERNAME;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!username || !passwordHash) return null;
  return { username, passwordHash };
}

export function adminConfigured(): boolean {
  return credentials() !== null;
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const creds = credentials();

  if (!creds) {
    await verifyPassword(password, await hashPassword('unconfigured'));
    return false;
  }

  const userMatches = safeEqualStrings(username, creds.username);
  const passwordMatches = await verifyPassword(password, creds.passwordHash);

  return userMatches && passwordMatches;
}
