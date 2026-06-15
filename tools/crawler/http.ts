import { HTTP_RETRIES } from "./config.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  retries = HTTP_RETRIES,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries) await sleep(400 * 2 ** attempt);
    }
  }
  throw new Error(`Failed ${label}: ${String(lastErr)}`);
}

export function fetchJson<T>(url: string): Promise<T> {
  return withRetry(`GET ${url}`, async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  });
}

/** Fetches binary content; returns null on a 404 (asset simply missing). */
export function fetchBuffer(url: string): Promise<Buffer | null> {
  return withRetry(`GET ${url}`, async () => {
    const res = await fetch(url);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  });
}

/** Runs an async worker over items with bounded concurrency. */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let done = 0;
  async function run(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]!, i);
      done++;
      onProgress?.(done, items.length);
    }
  }
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, run);
  await Promise.all(lanes);
  return results;
}
