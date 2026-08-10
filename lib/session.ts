import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from './db';

export const SESSION_COOKIE = 'kanbai_session';

const COOKIE_PATH = '/manage';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionRow extends RowDataPacket {
  id: number;
  username: string;
  expires_at: Date;
}

export type Session = {
  id: number;
  username: string;
  expiresAt: Date;
};

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() || h.get('x-real-ip') || '';
  return ip.slice(0, 45) || 'unknown';
}

export async function createSession(username: string): Promise<void> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MS);
  const h = await headers();

  await pool.query<ResultSetHeader>(
    'INSERT INTO sessions (token_hash, username, expires_at, user_agent, ip) VALUES (?, ?, ?, ?, ?)',
    [
      hashToken(token),
      username,
      expiresAt,
      (h.get('user-agent') ?? '').slice(0, 255) || null,
      await clientIp(),
    ]
  );

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: COOKIE_PATH,
    expires: expiresAt,
  });

  await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [rows] = await pool.query<SessionRow[]>(
    'SELECT id, username, expires_at FROM sessions WHERE token_hash = ? AND expires_at > NOW() LIMIT 1',
    [hashToken(token)]
  );

  const row = rows[0];
  if (!row) return null;

  return { id: row.id, username: row.username, expiresAt: row.expires_at };
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;

  if (token) {
    await pool.query('DELETE FROM sessions WHERE token_hash = ?', [hashToken(token)]);
  }

  store.delete({ name: SESSION_COOKIE, path: COOKIE_PATH });
}
