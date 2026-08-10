-- ============================================================
-- Auth tables for /manage.
--
-- Kept separate from schema.sql on purpose: schema.sql is a full
-- DROP/reset of the project data, whereas this file is idempotent and
-- safe to run against a live database at any time.
--
--   mysql -u <user> -p <db> < auth-schema.sql
--
-- There is no users table. The single admin lives entirely in env vars
-- (ADMIN_USERNAME / ADMIN_PASSWORD_HASH), so no credential material is
-- ever stored in the database.
-- ============================================================

-- Server-side sessions. The cookie carries a raw random token; only the
-- SHA-256 of that token is stored here, so a dump of this table cannot be
-- replayed as a valid session cookie.
CREATE TABLE IF NOT EXISTS sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  token_hash CHAR(64) NOT NULL,
  username VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  user_agent VARCHAR(255) NULL,
  ip VARCHAR(45) NULL,
  UNIQUE KEY uniq_token_hash (token_hash),
  KEY idx_expires_at (expires_at)
);

-- Failed-login throttling. One row per client IP, plus a single '@global'
-- row that backstops the per-IP rows: X-Forwarded-For is client-supplied
-- and therefore spoofable, so per-IP lockout alone can be rotated around.
-- The global row can only add delay, never a hard lock, so an attacker
-- can't use it to lock the real admin out.
CREATE TABLE IF NOT EXISTS login_attempts (
  ip VARCHAR(45) NOT NULL PRIMARY KEY,
  failures INT NOT NULL DEFAULT 0,
  last_failure DATETIME NULL,
  locked_until DATETIME NULL
);
