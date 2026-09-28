import 'server-only';
import {
  parseRank,
  parseStage,
  parseTags,
  productOf,
  summarize,
  type ProductStage,
  type ProductSummary,
  type RawItem,
} from './ado-progress';

/**
 * Azure DevOps reader for the portfolio.
 *
 * Read-only. Two kinds of query: the product epics (one per product, tagged
 * `product-epic` with `stage:` and `rank:` tags) and, per linked product, its
 * work items, which lib/ado-progress.ts turns into the bands and milestones.
 *
 * Configuration, all in env:
 *   ADO_ORG      the organisation, e.g. "paulburkart1"
 *   ADO_PROJECT  the project, e.g. "Orchestrata"
 *   ADO_PAT      a Personal Access Token with Work Items (Read) only
 *   ADO_BEARER   an AAD access token instead of a PAT, for orgs that accept one
 *   ADO_FIXTURE  local development without either: a snapshot file written by
 *                `npm run ado:snapshot`, read in place of the API
 *
 * Results are cached in memory for CACHE_MS and, on a failed refresh, the last
 * good copy is served instead of an error. When nothing is configured the
 * public page renders without any tracker data at all.
 */

const API = '7.1';
const CACHE_MS = 15 * 60 * 1000;
const BATCH = 200;

export type Product = {
  slug: string;
  epicId: number;
  title: string;
  stage: ProductStage;
  rank: number;
};

export type ProductSnapshot = Product & ProductSummary & { fetchedAt: number };

type Config = { org: string; project: string; auth: string };

function config(): Config | null {
  const org = process.env.ADO_ORG;
  const project = process.env.ADO_PROJECT;
  const pat = process.env.ADO_PAT;
  const bearer = process.env.ADO_BEARER;
  if (!org || !project || (!pat && !bearer)) return null;
  const auth = pat ? 'Basic ' + Buffer.from(':' + pat).toString('base64') : `Bearer ${bearer}`;
  return { org, project, auth };
}

export function adoConfigured(): boolean {
  return Boolean(process.env.ADO_FIXTURE) || config() !== null;
}

async function post<T>(c: Config, url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: c.auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!r.ok) throw new Error(`ADO ${url} -> ${r.status} ${(await r.text()).slice(0, 200)}`);
  return (await r.json()) as T;
}

async function wiqlIds(c: Config, query: string): Promise<number[]> {
  const url = `https://dev.azure.com/${encodeURIComponent(c.org)}/${encodeURIComponent(c.project)}/_apis/wit/wiql?api-version=${API}`;
  const r = await post<{ workItems: { id: number }[] }>(c, url, { query });
  return r.workItems.map((w) => w.id);
}

type Fields = Record<string, unknown>;

async function fields(c: Config, ids: number[], names: string[]): Promise<{ id: number; fields: Fields }[]> {
  const url = `https://dev.azure.com/${encodeURIComponent(c.org)}/_apis/wit/workitemsbatch?api-version=${API}`;
  const out: { id: number; fields: Fields }[] = [];
  for (let i = 0; i < ids.length; i += BATCH) {
    const r = await post<{ value: { id: number; fields: Fields }[] }>(c, url, {
      ids: ids.slice(i, i + BATCH),
      fields: names,
    });
    out.push(...r.value);
  }
  return out;
}

/** WIQL string literal: single quotes doubled. Slugs are validated on input; this is belt and braces. */
const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

async function fetchProducts(c: Config): Promise<Product[]> {
  const ids = await wiqlIds(
    c,
    `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] = 'Epic' AND [System.Tags] CONTAINS 'product-epic'`
  );
  const rows = await fields(c, ids, ['System.Title', 'System.Tags', 'System.AreaPath']);
  return rows
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
}

async function fetchItems(c: Config, slug: string): Promise<RawItem[]> {
  // The platform's own work lives under the project root and its "Company" area, with older tags.
  const scope =
    slug === 'orchestrata'
      ? `[System.AreaPath] = ${q(c.project)} OR [System.AreaPath] UNDER ${q(`${c.project}\\Company`)} OR [System.Tags] CONTAINS 'product:orchestrata' OR [System.Tags] CONTAINS 'console'`
      : `[System.AreaPath] UNDER ${q(`${c.project}\\${slug}`)} OR [System.Tags] CONTAINS ${q(`product:${slug}`)}`;
  const ids = await wiqlIds(
    c,
    `SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = @project AND [System.WorkItemType] <> 'Epic' AND [System.WorkItemType] <> 'Issue' AND (${scope})`
  );
  const rows = await fields(c, ids, [
    'System.WorkItemType',
    'System.State',
    'System.Tags',
    'System.AreaPath',
    'System.Title',
    'Microsoft.VSTS.Common.ClosedDate',
  ]);
  return rows
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
        closedAt: w.fields['Microsoft.VSTS.Common.ClosedDate']
          ? String(w.fields['Microsoft.VSTS.Common.ClosedDate'])
          : null,
        product: productOf(tags, areaPath),
      };
    })
    .filter((i) => i.product === slug);
}

// ---- cache ----

type Entry<T> = { at: number; value: T; pending: Promise<T> | null };

type Cache = { products?: Entry<Product[]>; snapshots: Map<string, Entry<ProductSnapshot | null>> };

const g = globalThis as unknown as { kanbaiAdo?: Cache };
const cache: Cache = g.kanbaiAdo ?? { snapshots: new Map() };
if (process.env.NODE_ENV !== 'production') g.kanbaiAdo = cache;

/** Serve fresh if young enough, otherwise refresh; on failure keep serving the last good value. */
async function remember<T>(
  get: () => Entry<T> | undefined,
  set: (e: Entry<T>) => void,
  load: () => Promise<T>,
  empty: T
): Promise<T> {
  const now = Date.now();
  const have = get();
  if (have && now - have.at < CACHE_MS) return have.value;
  if (have?.pending) return have.pending;

  const pending = load()
    .then((value) => {
      set({ at: Date.now(), value, pending: null });
      return value;
    })
    .catch((err) => {
      console.error('[ado] refresh failed:', err instanceof Error ? err.message : err);
      if (have) {
        set({ ...have, pending: null });
        return have.value;
      }
      // Nothing cached yet: remember the failure briefly so a broken token does not hammer the API.
      set({ at: Date.now() - CACHE_MS + 60_000, value: empty, pending: null });
      return empty;
    });
  set({ at: have?.at ?? 0, value: have?.value ?? empty, pending });
  return pending;
}

// ---- fixture: a snapshot file from scripts/ado-snapshot.mjs, for local development without a PAT ----

type Fixture = { products: Product[]; snapshots: Record<string, ProductSnapshot> };

async function fixture(): Promise<Fixture | null> {
  const file = process.env.ADO_FIXTURE;
  if (!file) return null;
  const { readFile } = await import('node:fs/promises');
  const { resolve } = await import('node:path');
  try {
    const raw = JSON.parse(await readFile(resolve(process.cwd(), file), 'utf8')) as Partial<Fixture>;
    return { products: raw.products ?? [], snapshots: raw.snapshots ?? {} };
  } catch (err) {
    console.error(`[ado] could not read ADO_FIXTURE ${file}:`, err instanceof Error ? err.message : err);
    return { products: [], snapshots: {} };
  }
}

export async function getProducts(): Promise<Product[]> {
  const fx = await fixture();
  if (fx) return fx.products;
  const c = config();
  if (!c) return [];
  return remember(
    () => cache.products,
    (e) => (cache.products = e),
    () => fetchProducts(c),
    []
  );
}

export async function getProductSnapshot(slug: string): Promise<ProductSnapshot | null> {
  const fx = await fixture();
  if (fx) return fx.snapshots[slug] ?? null;
  const c = config();
  if (!c) return null;
  return remember(
    () => cache.snapshots.get(slug),
    (e) => cache.snapshots.set(slug, e),
    async () => {
      const [products, items] = await Promise.all([getProducts(), fetchItems(c, slug)]);
      const product = products.find((p) => p.slug === slug);
      if (!product) return null;
      return { ...product, ...summarize(items, { slug }), fetchedAt: Date.now() };
    },
    null
  );
}

export async function getProductSnapshots(slugs: string[]): Promise<Map<string, ProductSnapshot | null>> {
  const unique = [...new Set(slugs)];
  const results = await Promise.all(unique.map((s) => getProductSnapshot(s)));
  return new Map(unique.map((s, i) => [s, results[i]]));
}
