#!/usr/bin/env node
/**
 * Generates an ADMIN_PASSWORD_HASH for .env.local.
 *
 *   npm run hash-password
 *
 * Reads the password from a hidden prompt rather than argv, so it never lands
 * in your shell history or the process list. Mirrors lib/password.ts — keep the
 * parameters in sync if you change them there.
 */
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const scrypt = promisify(scryptCb);

const N = 32768;
const R = 8;
const P = 1;
const KEYLEN = 64;
const MAXMEM = 128 * N * R * 2;

function prompt(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: stdin, output: stdout, terminal: true });

    if (hidden) {
      // Suppress echo so the password isn't shown as it's typed.
      const onData = (char) => {
        const s = String(char);
        if (s === '\n' || s === '\r' || s === '') {
          stdin.removeListener('data', onData);
        } else {
          stdout.write('\x1b[2K\x1b[200D' + question + '*'.repeat(rl.line.length));
        }
      };
      stdin.on('data', onData);
    }

    rl.question(question, (answer) => {
      rl.close();
      if (hidden) stdout.write('\n');
      resolve(answer);
    });
  });
}

const password = await prompt('Password: ', { hidden: true });
const confirm = await prompt('Confirm:  ', { hidden: true });

if (!password) {
  console.error('\nAborted: empty password.');
  process.exit(1);
}
if (password !== confirm) {
  console.error('\nAborted: passwords do not match.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('\nAborted: use at least 12 characters. This is the only credential.');
  process.exit(1);
}

const salt = randomBytes(16);
const derived = await scrypt(password.normalize('NFKC'), salt, KEYLEN, {
  N,
  r: R,
  p: P,
  maxmem: MAXMEM,
});
const hash = `scrypt:${N}:${R}:${P}:${salt.toString('base64url')}:${derived.toString('base64url')}`;

console.log('\nAdd these two lines to .env.local (that file is gitignored):\n');
console.log(`ADMIN_USERNAME=your-username`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('\nNo quotes needed — the hash is base64url, so nothing in it is');
console.log('expanded by a shell or by the .env loader.');
console.log('Restart the dev server afterwards so it picks up the new values.\n');
