import 'server-only';
import type { RowDataPacket } from 'mysql2';
import { pool } from './db';

const GLOBAL_KEY = '@global';

// Per-IP: hard lockout after this many consecutive failures.
const IP_LOCK_AFTER = 5;
const IP_LOCK_BASE_MS = 60_000;
const IP_LOCK_MAX_MS = 60 * 60_000;

// Global: delay only, never a lock — see below.
const GLOBAL_DELAY_AFTER = 10;
const GLOBAL_DELAY_STEP_MS = 250;
const GLOBAL_DELAY_MAX_MS = 5_000;

// Consecutive-failure counters reset after a quiet period.
const DECAY_MS = 60 * 60_000;

interface AttemptRow extends RowDataPacket {
  failures: number;
  last_failure: Date | null;
  locked_until: Date | null;
}

async function readRow(key: string): Promise<AttemptRow | null> {
  const [rows] = await pool.query<AttemptRow[]>(
    'SELECT failures, last_failure, locked_until FROM login_attempts WHERE ip = ? LIMIT 1',
    [key]
  );
  const row = rows[0];
  if (!row) return null;

  // Treat a long-stale counter as reset without needing a cleanup job.
  if (row.last_failure && Date.now() - new Date(row.last_failure).getTime() > DECAY_MS) {
    return { ...row, failures: 0 } as AttemptRow;
  }
  return row;
}

export type LockState = { locked: true; retryAfterSec: number } | { locked: false };

/**
 * Per-IP lockout. X-Forwarded-For is client-supplied and therefore spoofable,
 * so this is the honest-user guard rather than the whole defense; the global
 * delay below is what an attacker rotating IPs actually runs into.
 */
export async function checkLock(ip: string): Promise<LockState> {
  const row = await readRow(ip);
  if (!row?.locked_until) return { locked: false };

  const remainingMs = new Date(row.locked_until).getTime() - Date.now();
  if (remainingMs <= 0) return { locked: false };

  return { locked: true, retryAfterSec: Math.ceil(remainingMs / 1000) };
}

export async function applyGlobalDelay(): Promise<void> {
  const row = await readRow(GLOBAL_KEY);
  const failures = row?.failures ?? 0;
  if (failures <= GLOBAL_DELAY_AFTER) return;

  const delay = Math.min(
    (failures - GLOBAL_DELAY_AFTER) * GLOBAL_DELAY_STEP_MS,
    GLOBAL_DELAY_MAX_MS
  );
  await new Promise((resolve) => setTimeout(resolve, delay));
}

export async function recordFailure(ip: string): Promise<void> {
  for (const key of [ip, GLOBAL_KEY]) {
    const row = await readRow(key);
    const failures = (row?.failures ?? 0) + 1;

    let lockedUntil: Date | null = null;
    if (key !== GLOBAL_KEY && failures >= IP_LOCK_AFTER) {
      const over = failures - IP_LOCK_AFTER;
      const ms = Math.min(IP_LOCK_BASE_MS * 2 ** over, IP_LOCK_MAX_MS);
      lockedUntil = new Date(Date.now() + ms);
    }

    await pool.query(
      `INSERT INTO login_attempts (ip, failures, last_failure, locked_until)
       VALUES (?, ?, NOW(), ?)
       ON DUPLICATE KEY UPDATE failures = VALUES(failures),
                               last_failure = VALUES(last_failure),
                               locked_until = VALUES(locked_until)`,
      [key, failures, lockedUntil]
    );
  }
}

export async function clearFailures(ip: string): Promise<void> {
  await pool.query('DELETE FROM login_attempts WHERE ip IN (?, ?)', [ip, GLOBAL_KEY]);
}
