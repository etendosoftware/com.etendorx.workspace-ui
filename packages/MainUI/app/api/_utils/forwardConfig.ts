import type { NextRequest } from "next/server";
import { getErpSessionCookie } from "./sessionStore";

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
export function getCombinedErpCookieHeader(request: Request | NextRequest, userToken: string | null): string {
  if (!shouldForwardErpCookies()) return "";
  const incomingCookie = request.headers.get("cookie") || "";
  const erpSessionCookie = userToken ? getErpSessionCookie(userToken) : null;
  return [incomingCookie, erpSessionCookie].filter(Boolean).join("; ");
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
