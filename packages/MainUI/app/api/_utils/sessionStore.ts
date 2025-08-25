// Very simple in-memory ERP session store.
// Keys: Bearer token string returned by ERP login (data.token)
// Values: cookie header string to send to ERP (e.g., "JSESSIONID=...")
//
// Persist across Next dev Fast Refresh by attaching to globalThis.
// In prod/serverless, consider replacing with a shared store (Redis/KV).

type SessionValue = {
  cookieHeader?: string;
  csrfToken?: string;
};

type SessionMap = Map<string, SessionValue>;
const globalKey = "__ERP_SESSION_STORE__";
// biome-ignore lint/suspicious/noExplicitAny: adopt global typing safely
const g = globalThis as any;
const store: SessionMap = g[globalKey] ?? new Map<string, SessionValue>();
if (!g[globalKey]) {
  g[globalKey] = store;
}

export function setErpSessionCookie(
  token: string,
  { cookieHeader, csrfToken }: { cookieHeader: string; csrfToken: string | null }
) {
  if (!token?.trim() || !cookieHeader?.trim()) {
    throw new Error("Valid token and cookieHeader are required to set ERP session");
  }
  const key = String(token);
  const existing = store.get(key) ?? {};
  const merged = { ...existing, cookieHeader } as SessionValue;
  if (csrfToken?.trim()) merged.csrfToken = csrfToken;
  store.set(key, merged);
}

export function setErpCsrfToken(token: string, csrfToken: string) {
  if (!token?.trim() || !csrfToken?.trim()) {
    throw new Error("Valid token and csrfToken are required");
  }
  const key = String(token);
  const existing = store.get(key) ?? {};
  const merged = { ...existing, csrfToken } as SessionValue;
  store.set(key, merged);
}

export function getErpSessionCookie(token: string | null | undefined): string | null {
  if (!token) return null;
  const keyToken: string = String(token);

  const v = store.get(keyToken) ?? null;
  if (!v) {
    throw new Error("No session found for token");
  }
  return v?.cookieHeader ?? null;
}

export function getErpCsrfToken(token: string | null | undefined): string | null {
  if (!token) return null;
  const keyToken: string = String(token);
  const v = store.get(keyToken) ?? null;
  if (!v) return null;
  return v.csrfToken ?? null;
}

export function clearErpSessionCookie(token: string) {
  store.delete(token);
}
