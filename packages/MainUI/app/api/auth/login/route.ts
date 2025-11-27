import { type NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { setErpSessionCookie } from "@/app/api/_utils/sessionStore";
import { extractBearerToken } from "@/lib/auth";
import { joinUrl } from "../../_utils/url";
import { handleLoginError } from "../../_utils/sessionErrors";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

function validateEnvironment(): void {
  if (!process.env.ETENDO_CLASSIC_URL) {
    console.error("ETENDO_CLASSIC_URL environment variable is not set");
    throw new Error("Server configuration error");
  }
}

async function fetchErpLogin(
  erpLoginUrl: string,
  body: any,
  cookieHeader?: string,
  userToken?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (userToken) {
    headers.Authorization = `Bearer ${userToken}`;
  }

  return fetch(erpLoginUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).catch((fetchError) => {
    console.error("Fetch error - Etendo Classic backend not accessible:", fetchError);
    throw new Error("Etendo Classic backend is not accessible");
  });
}

function extractJSessionId(erpResponse: Response): string | null {
  const jsession: string | null = null;

  const single = erpResponse.headers.get("set-cookie");
  if (single) {
    const match = single.match(/JSESSIONID=([^;]+)/);
    if (match) return match[1];
  }

  for (const [key, value] of erpResponse.headers.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      const match = value.match(/JSESSIONID=([^;]+)/);
      if (match) return match[1];
    }
  }

  return jsession;
}

function storeCookieForToken(erpResponse: Response, data: any): void {
  try {
    const jsession = extractJSessionId(erpResponse);
    const csrfToken = erpResponse.headers.get("X-CSRF-Token") || erpResponse.headers.get("x-csrf-token") || null;
    const cookieHeader = `JSESSIONID=${jsession}`;
    setErpSessionCookie(data.token, { cookieHeader, csrfToken });
  } catch (e) {
    console.error("Error storing session cookie:", e);
    throw new Error("Failed to store session cookie");
  }
}

export async function POST(request: NextRequest) {
  try {
    validateEnvironment();

    const body = await request.json();
    const erpLoginUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/sws/login");

    const userToken = extractBearerToken(request);
    let cookieHeader: string | null = null;

    if (userToken) {
      cookieHeader = "JSESSIONID=null";
    }

    const erpResponse = await fetchErpLogin(erpLoginUrl, body, cookieHeader || undefined, userToken || undefined);

    if (!erpResponse || !erpResponse.ok) {
      throw new Error("ERP login failed", { cause: erpResponse });
    }

    const data = await erpResponse.json().catch((jsonError) => {
      throw new Error("Invalid response from Etendo Classic backend", { cause: jsonError });
    });

    if (data.status === "error") {
      const message = data.message || "Login failed";
      return NextResponse.json({ message }, { status: 401 });
    }

    storeCookieForToken(erpResponse, data);

    if (!erpResponse.ok) {
      return NextResponse.json({ error: data.error || "Login failed" }, { status: erpResponse.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleLoginError(error);
  }
}
