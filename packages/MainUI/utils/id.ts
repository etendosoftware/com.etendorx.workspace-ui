/*
 Utility functions for generating unique identifiers using secure randomness
 where available, with safe fallbacks for older environments.
*/

let fallbackCounter = 0;

/**
 * Generates a UUID v4 using the Web Crypto API when available.
 * Falls back to a timestamp + counter pattern if secure sources are unavailable.
 */
export function generateId(prefix = ""): string {
  try {
    // Prefer standard randomUUID if present (browser/modern runtimes)
    const g: any = globalThis as any;
    if (g?.crypto?.randomUUID && typeof g.crypto.randomUUID === "function") {
      return `${prefix}${g.crypto.randomUUID()}`;
    }

    // Fallback: build UUID v4 from getRandomValues if available
    if (g?.crypto?.getRandomValues && typeof g.crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      g.crypto.getRandomValues(bytes);
      // Per RFC 4122 section 4.4
      bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
      bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

      const toHex = (n: number) => n.toString(16).padStart(2, "0");
      const hex = Array.from(bytes, toHex).join("");
      const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
      return `${prefix}${uuid}`;
    }
  } catch {
    // Swallow errors and use fallback below
  }

  // Ultimate fallback (non-crypto): sufficient for logging/tracking IDs, not secrets
  fallbackCounter = (fallbackCounter + 1) % Number.MAX_SAFE_INTEGER;
  const ts = Date.now().toString(36);
  const perf = (typeof performance !== "undefined" && performance.now) ? Math.floor(performance.now()).toString(36) : "0";
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}${ts}-${perf}-${fallbackCounter}-${rand}`;
}

