#!/usr/bin/env node
/**
 * Write a tracker snapshot to a JSON file using your Azure CLI login, so the
 * app can run locally with real numbers and no PAT.
 *
 *   npm run ado:snapshot                      every product that is not killed
 *   npm run ado:snapshot -- job-hunt relic-vault
 *
 * Output: demo/tracker.json. Point ADO_FIXTURE at it in .env.local and the app
 * reads that file instead of Azure DevOps. The counting rules are the same
 * module the live path uses (lib/ado-progress.ts), so a snapshot and a live
 * fetch agree.
 *
 * Needs the Azure CLI with the azure-devops extension and a stored login
 * (`az devops login`, or `az login` for an org that accepts it).
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseRank, parseStage, parseTags, productOf, summarize } from '../lib/ado-progress.ts';

const ORG = process.env.ADO_ORG ?? 'paulburkart1';
const PROJECT = process.env.ADO_PROJECT ?? 'Orchestrata';
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'demo', 'tracker.json');
const win = process.platform === 'win32';

// On Windows `az` is a .cmd, which Node will only run through a shell, and a shell
// splits arguments on spaces unless they are quoted. WIQL has no double quotes.
const quote = (a) => (win && /[\s<>]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);

// The CLI is Python launched in isolated mode, so on Windows it writes the ANSI code page
// whatever the environment says, and an em dash in a title comes out as one byte that is not
// UTF-8. Decode strictly first and fall back to Windows-1252 rather than accept a replacement
// character.
function decode(buf) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

function query(wiql) {
  const args = ['boards', 'query', '--org', `https://dev.azure.com/${ORG}`, '--project', PROJECT, '--wiql', wiql, '-o', 'json'];
  const r = spawnSync(win ? 'az.cmd' : 'az', args.map(quote), {
    encoding: 'buffer',
    shell: win,
    maxBuffer: 64 * 1024 * 1024,
  });
  const stdout = decode(r.stdout ?? Buffer.alloc(0));
  if (r.status !== 0) {
    console.error(decode(r.stderr ?? Buffer.alloc(0)) || stdout);
    process.exit(1);
  }
  return JSON.parse(stdout);
}

const q = (s) => `'${s.replace(/'/g, "''")}'`;

const epics = query(
  `SELECT [System.Id],[System.Title],[System.Tags],[System.AreaPath] FROM WorkItems WHERE [System.WorkItemType] = 'Epic' AND [System.Tags] CONTAINS 'product-epic'`
);
const products = epics
  .map((w) => {
    const tags = parseTags(w.fields['System.Tags']);
    return {
      slug: productOf(tags, String(w.fields['System.AreaPath'] ?? '')),
      epicId: w.id,
      title: String(w.fields['System.Title'] ?? ''),
      stage: parseStage(tags),
      rank: parseRank(tags),
    };
  })
  .sort((a, b) => a.rank - b.rank || a.slug.localeCompare(b.slug));

// By default every product past the design document, plus any at Brief that already has cards moving:
// the stage tag lags reality (stonewake, cold-harvest). Named slugs override.
const wanted = process.argv.slice(2);
const slugs = wanted.length ? wanted : products.filter((p) => p.stage !== 'Killed').map((p) => p.slug);

const snapshots = {};
for (const slug of slugs) {
  const product = products.find((p) => p.slug === slug);
  if (!product) {
    console.error(`no product epic for ${slug}`);
    continue;
  }
  const scope =
    slug === 'orchestrata'
      ? `[System.AreaPath] = ${q(PROJECT)} OR [System.AreaPath] UNDER ${q(`${PROJECT}\\Company`)} OR [System.Tags] CONTAINS 'product:orchestrata' OR [System.Tags] CONTAINS 'console'`
      : `[System.AreaPath] UNDER ${q(`${PROJECT}\\${slug}`)} OR [System.Tags] CONTAINS ${q(`product:${slug}`)}`;
  const rows = query(
    `SELECT [System.Id],[System.WorkItemType],[System.State],[System.Tags],[System.AreaPath],[System.Title],[Microsoft.VSTS.Common.ClosedDate] FROM WorkItems WHERE [System.WorkItemType] <> 'Epic' AND [System.WorkItemType] <> 'Issue' AND (${scope})`
  );
  const items = rows
    .map((w) => {
      const tags = parseTags(w.fields['System.Tags']);
      const areaPath = String(w.fields['System.AreaPath'] ?? '');
      return {
        id: w.id,
        type: String(w.fields['System.WorkItemType'] ?? ''),
        state: String(w.fields['System.State'] ?? ''),
        tags,
        areaPath,
        title: String(w.fields['System.Title'] ?? ''),
        closedAt: w.fields['Microsoft.VSTS.Common.ClosedDate'] ? String(w.fields['Microsoft.VSTS.Common.ClosedDate']) : null,
        product: productOf(tags, areaPath),
      };
    })
    .filter((i) => i.product === slug);
  snapshots[slug] = { ...product, ...summarize(items, { slug }), fetchedAt: Date.now() };
  const p = snapshots[slug].progress;
  console.log(`${slug.padEnd(34)} ${product.stage.padEnd(8)} backlog ${p.backlog}  active ${p.inProgress}  review ${p.inReview}  done ${p.done}  milestones ${snapshots[slug].recentMilestones.length}`);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ takenAt: new Date().toISOString(), products, snapshots }, null, 2) + '\n');
console.log(`\nwrote ${OUT}`);
