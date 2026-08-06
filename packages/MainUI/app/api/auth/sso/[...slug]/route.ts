import { type NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { setErpSessionCookie, setErpCsrfToken } from "@/app/api/_utils/sessionStore";
import { joinUrl } from "../../../_utils/url";

// SSO endpoints (/meta/sso/*) are unauthenticated — this proxy avoids CORS and,
// on a successful callback, stashes the ERP session cookie so later /api/erp
// calls carry the JSESSIONID (same trick as the password login route).

function ssoUrl(slug: string): string {
  if (!process.env.ETENDO_CLASSIC_URL) throw new Error("ETENDO_CLASSIC_URL is not set");
  // Same servlet mapping the metadata client uses: /sws/com.etendoerp.metadata.meta/*
  return joinUrl(process.env.ETENDO_CLASSIC_URL, `/sws/com.etendoerp.metadata.meta/sso/${slug}`);
}

function extractJSessionId(res: Response): string | null {
  const cookies = (res.headers as { getSetCookie?: () => string[] }).getSetCookie?.();
  for (const cookie of cookies ?? [res.headers.get("set-cookie") ?? ""]) {
    const match = cookie.match(/JSESSIONID=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

function storeCookieForToken(res: Response, token: string): void {
  const csrfToken = res.headers.get("X-CSRF-Token") || res.headers.get("x-csrf-token") || null;
  const jsession = extractJSessionId(res);
  if (jsession) {
    setErpSessionCookie(token, { cookieHeader: `JSESSIONID=${jsession}`, csrfToken });
  } else if (csrfToken) {
    setErpCsrfToken(token, csrfToken);
  }
}

export async function GET(_request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await context.params;
  try {
    const erpResponse = await fetch(ssoUrl(slug.join("/")), { headers: { Accept: "application/json" } });
    const data = await erpResponse.json().catch(() => ({}));
    return NextResponse.json(data, { status: erpResponse.status });
  } catch (error) {
    console.error("SSO proxy GET error:", error);
    return NextResponse.json({ error: "sso_proxy_error" }, { status: 502 });
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await context.params;
  try {
    const body = await request.text();
    const erpResponse = await fetch(ssoUrl(slug.join("/")), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body,
    });
    const data = await erpResponse.json().catch(() => ({}));

    if (erpResponse.ok && data.token) {
      storeCookieForToken(erpResponse, data.token);
    }

    return NextResponse.json(data, { status: erpResponse.status });
  } catch (error) {
    console.error("SSO proxy POST error:", error);
    return NextResponse.json({ error: "sso_proxy_error" }, { status: 502 });
  }
}
