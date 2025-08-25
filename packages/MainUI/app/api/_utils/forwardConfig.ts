import type { NextRequest } from "next/server";
import { getErpSessionCookie, getErpCsrfToken } from "./sessionStore";

function getEnvVar(key: string): string | undefined {
  try {
    // In Node runtime
    // biome-ignore lint/suspicious/noExplicitAny: process may be undefined in edge
    const p: any = typeof process !== "undefined" ? process : undefined;
    return p?.env?.[key];
  } catch {
    return undefined;
  }
}

/**
 * Controls if ERP cookies (e.g., JSESSIONID) are forwarded to Classic.
 * Set ERP_FORWARD_COOKIES=false to run in session-less mode.
 */
export function shouldForwardErpCookies(): boolean {
  const v = getEnvVar("ERP_FORWARD_COOKIES");
  if (typeof v === "string") {
    return v.toLowerCase() !== "false" && v !== "0";
  }
  return true; // default: forward cookies (stateful)
}

/**
 * Returns the Cookie header to forward to ERP, combining any incoming browser cookies
 * with the stored ERP session cookie (captured at login), unless disabled by config.
 */
export function getCombinedErpCookieHeader(request: Request | NextRequest | null, userToken: string | null): string {
  if (!shouldForwardErpCookies()) return "";

  // Extract browser Cookie header if available
  let browserCookie: string | null = null;
  try {
    browserCookie = request?.headers?.get("cookie") ?? null;
  } catch {
    browserCookie = null;
  }

  const erpSessionCookie = userToken ? getErpSessionCookie(userToken) : null;

  const parts: string[] = [];
  if (browserCookie) parts.push(browserCookie);
  if (erpSessionCookie) parts.push(erpSessionCookie);

  return parts.join("; ");
}

/**
 * Returns both the combined Cookie header and the stored X-CSRF-Token for the user token.
 * Useful so routes can forward both Cookie and X-CSRF-Token to Etendo Classic when present.
 */
export function getErpAuthHeaders(
  requestOrToken?: Request | NextRequest | string | null,
  maybeToken?: string | null
): { cookieHeader: string; csrfToken: string | null } {
  // Normalize arguments: allow calling as (request, token) or (token)
  const isRequest = (obj: unknown): obj is Request | NextRequest => {
    if (!obj || typeof obj !== "object") return false;
    const candidate = obj as Record<string, unknown>;
    return (
      "headers" in candidate &&
      typeof candidate.headers === "object" &&
      candidate.headers !== null &&
      typeof (candidate.headers as Record<string, unknown>).get === "function"
    );
  };

  const request = isRequest(requestOrToken) ? (requestOrToken as Request | NextRequest) : null;
  const token = isRequest(requestOrToken)
    ? (maybeToken ?? null)
    : ((requestOrToken as string | null | undefined) ?? null);

  const cookieHeader = getCombinedErpCookieHeader(request, token);
  const csrfToken = token ? getErpCsrfToken(token) : null;
  return { cookieHeader, csrfToken };
}

/**
 * Controls if JSON bodies should be forwarded unchanged to ERP.
 * Set ERP_FORWARD_JSON_PASSTHROUGH=true to skip JSON->form conversion.
 * Also auto-enables when URL param `isc_dataFormat=json` is present.
 */
export function shouldPassthroughJson(request: Request | NextRequest): boolean {
  try {
    const url = new URL(request.url);
    const v = url.searchParams.get("isc_dataFormat");
    return !!v && v.toLowerCase() === "json";
  } catch {
    return false;
  }
}
