#!/usr/bin/env node
/**
 * Stand up a throwaway MariaDB in Docker for local development and load the
 * schema plus demo content.
 *
 *   npm run demo:db            start (or reuse) the container and (re)apply the SQL
 *   npm run demo:db -- --down  remove the container and its data
 *
 * Listens on 127.0.0.1:3307. The root password is `kanbai-demo`, which is fine
 * for a container bound to loopback holding nothing real. Copy demo/env.example
 * to .env.local to point the app at it.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const NAME = 'kanbai-demo-db';
const PASSWORD = 'kanbai-demo';
const PORT = 3307;
const IMAGE = 'mariadb:11';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function docker(args, input) {
  const r = spawnSync('docker', args, { input, encoding: 'utf8' });
  if (r.error) {
    console.error(`docker: ${r.error.message}. Is Docker Desktop running?`);
    process.exit(1);
  }
  return { ok: r.status === 0, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

if (process.argv.includes('--down')) {
  docker(['rm', '-f', NAME]);
  console.log(`removed ${NAME}`);
  process.exit(0);
}

const names = docker(['ps', '--filter', `name=${NAME}`, '--format', '{{.Names}}']).out.split(/\r?\n/);
if (!names.includes(NAME)) {
  docker(['rm', '-f', NAME]);
  const r = docker([
    'run', '-d', '--name', NAME,
    '-e', `MARIADB_ROOT_PASSWORD=${PASSWORD}`,
    '-e', 'MARIADB_DATABASE=kanbai',
    '-p', `127.0.0.1:${PORT}:3306`,
    IMAGE,
  ]);
  if (!r.ok) {
    console.error(r.out);
    process.exit(1);
  }
  console.log(`started ${NAME} on 127.0.0.1:${PORT}`);
}

const deadline = Date.now() + 90_000;
for (;;) {
  const r = docker(['exec', NAME, 'mariadb', '-uroot', `-p${PASSWORD}`, '-e', 'SELECT 1']);
  if (r.ok) break;
  if (Date.now() > deadline) {
    console.error(`database did not come up:\n${r.out}`);
    process.exit(1);
  }
  await new Promise((res) => setTimeout(res, 1500));
}

for (const file of ['demo/schema.sql', 'auth-schema.sql', 'portfolio-schema.sql', 'demo/seed.sql']) {
  const sql = readFileSync(resolve(root, file), 'utf8');
  const r = docker(['exec', '-i', NAME, 'mariadb', '-uroot', `-p${PASSWORD}`, 'kanbai'], sql);
  if (!r.ok) {
    console.error(`${file}: ${r.out}`);
    process.exit(1);
  }
  console.log(`applied ${file}`);
}

console.log('\nDemo database ready. Copy demo/env.example to .env.local, then `npm run dev` or `npm run dev:az`.');
