// lib/db.ts
import mysql from 'mysql2/promise';

const host = process.env.DB_HOST ?? '';

// Hosted MySQL (TiDB Cloud, PlanetScale, etc.) refuses plaintext connections,
// and anything crossing the public internet should be encrypted regardless.
// TLS is therefore the default and only skipped for loopback, where the traffic
// never leaves the machine. DB_SSL=true|false overrides the detection.
const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
const useSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : !isLoopback;

function createPool() {
  return mysql.createPool({
    host,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 5,

    // A remote serverless database closes idle connections from its side, and
    // mysql2 has no query timeout — hand out a socket the server has already
    // dropped and pool.query() waits forever with no error. Over loopback this
    // never happened; against TiDB it hangs the request.
    //
    // Retire idle connections before the far end does, keep the survivors warm
    // with TCP keepalives, and fail fast on connect instead of blocking.
    idleTimeout: 30_000,
    maxIdle: 2,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    connectTimeout: 10_000,

    // Public-CA certificates, so Node's bundled trust store validates them —
    // no CA bundle to ship. Keeping rejectUnauthorized on is what makes the
    // encryption meaningful; disabling it would accept any certificate.
    ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
  });
}

// Turbopack re-evaluates modules on hot reload, so a bare createPool() call
// would build a fresh pool on every edit and leak the old ones — each still
// holding connections. Caching on globalThis keeps exactly one pool per dev
// process. Production loads the module once, so it just creates it directly.
const globalForDb = globalThis as unknown as { kanbaiPool?: mysql.Pool };

export const pool = globalForDb.kanbaiPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.kanbaiPool = pool;
}
