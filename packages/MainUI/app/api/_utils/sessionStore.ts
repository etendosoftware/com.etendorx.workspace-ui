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

/**
 * Generates a cryptographically secure CSRF token
 * @returns A random CSRF token string
 */
export function generateCsrfToken(): string {
  // Use crypto.randomUUID() if available (Node.js 14.17.0+), otherwise fallback
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").toUpperCase();
  }

  // Fallback: generate random hex string
  const array = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Last resort fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

  // Only set csrfToken if it's provided - do NOT generate a random one
  // The CSRF token must come from Etendo's session, not be generated here
  if (csrfToken?.trim()) {
    merged.csrfToken = csrfToken;
  }

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
    return null;
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

export function clearAllErpSessions() {
  store.clear();
}
