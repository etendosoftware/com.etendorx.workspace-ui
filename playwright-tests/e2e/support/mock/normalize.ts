/**
 * Request keys of the mocked-backend layer: two requests that ask the backend the same thing get
 * the same key, however the UI happened to spell them (parameter order, volatile values).
 */

/** Query and body properties whose value changes on every run and never selects the answer. */
export const VOLATILE_KEYS: ReadonlySet<string> = new Set([
  "_noCache",
  "_timestamp",
  "csrfToken",
  "isc_metaDataPrefix",
  "language",
  // Selector datasource requests carry the time the form record was loaded
  "recordTime",
  // Login: the recordings keep no credentials (scripts/sanitize-har.mjs), so the key ignores them
  "password",
]);

/** The part of a request the key is built from. */
export interface KeyedRequest {
  method: string;
  url: string;
  postData?: string | null;
}

/** JSON with object keys sorted and volatile keys removed, at any depth. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonical);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value as object)
        .filter((key) => !VOLATILE_KEYS.has(key))
        .sort()
        .map((key) => [key, canonical((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}

/** A request body as a stable string: canonical JSON, or the raw text when it is not JSON. */
export function canonicalBody(postData: string | null | undefined): string {
  if (!postData) {
    return "";
  }
  try {
    return JSON.stringify(canonical(JSON.parse(postData)));
  } catch {
    return postData;
  }
}

/** Path and query of a URL, with the query sorted and volatile parameters removed. */
export function canonicalUrl(url: string): string {
  const parsed = new URL(url, "http://localhost");
  const params = [...parsed.searchParams.entries()]
    .filter(([key]) => !VOLATILE_KEYS.has(key))
    .sort(([a, aValue], [b, bValue]) => a.localeCompare(b) || aValue.localeCompare(bValue));
  const query = new URLSearchParams(params).toString();
  return query ? `${parsed.pathname}?${query}` : parsed.pathname;
}

/** The key a recorded response is stored under and a live request is looked up with. */
export function requestKey({ method, url, postData }: KeyedRequest): string {
  return [method.toUpperCase(), canonicalUrl(url), canonicalBody(postData)].join(" ");
}
