// lib/db.ts
import mysql from 'mysql2/promise';

const host = process.env.DB_HOST ?? '';

// Hosted MySQL (TiDB Cloud, PlanetScale, etc.) refuses plaintext connections,
// and anything crossing the public internet should be encrypted regardless.
// TLS is therefore the default and only skipped for loopback, where the traffic
// never leaves the machine. DB_SSL=true|false overrides the detection.
const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
const useSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : !isLoopback;

export const pool = mysql.createPool({
  host,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  // These providers present certificates from public CAs, so Node's bundled
  // trust store validates them — no CA bundle to ship. Leaving
  // rejectUnauthorized on is what actually makes the encryption meaningful;
  // turning it off would accept any certificate and defeat the point.
  ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
});
