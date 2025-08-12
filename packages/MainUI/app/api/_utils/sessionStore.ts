// Very simple in-memory ERP session store.
// Keys: Bearer token string returned by ERP login (data.token)
// Values: cookie header string to send to ERP (e.g., "JSESSIONID=...")
//
// Persist across Next dev Fast Refresh by attaching to globalThis.
// In prod/serverless, consider replacing with a shared store (Redis/KV).

type SessionMap = Map<string, string>;
const globalKey = "__ERP_SESSION_STORE__";
// biome-ignore lint/suspicious/noExplicitAny: adopt global typing safely
const g = globalThis as any;
const store: SessionMap = g[globalKey] ?? new Map<string, string>();
if (!g[globalKey]) {
  g[globalKey] = store;
}

export function setErpSessionCookie(token: string, cookieHeader: string) {
  if (token && cookieHeader) {
    store.set(token, cookieHeader);
  }
}

export function getErpSessionCookie(token: string | null | undefined): string | null {
  if (!token) return null;
  return store.get(token) ?? null;
}

export function clearErpSessionCookie(token: string) {
  store.delete(token);
}
