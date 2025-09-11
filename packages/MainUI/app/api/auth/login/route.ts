import { type NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { setErpSessionCookie, getErpSessionCookie } from "@/app/api/_utils/sessionStore";
import { extractBearerToken } from "@/lib/auth";
import { joinUrl } from "../../_utils/url";

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

function getCookieHeader(userToken: string): string | null {
  try {
    return getErpSessionCookie(userToken);
  } catch (error) {
    console.error("Error getting cookie header:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    validateEnvironment();

    const body = await request.json();
    const erpLoginUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/meta/login");

    const userToken = extractBearerToken(request);
    let cookieHeader: string | null = null;

    console.log("Login request debug:", {
      hasAuthHeader: !!request.headers.get("Authorization"),
      userToken: userToken ? `${userToken.substring(0, 10)}...` : null,
      requestBody: body,
    });

    if (userToken) {
      cookieHeader = getCookieHeader(userToken);
    }

    const erpResponse = await fetchErpLogin(erpLoginUrl, body, cookieHeader || undefined, userToken || undefined);

    if (!erpResponse || !erpResponse.ok) {
      throw new Error("ERP login failed", { cause: erpResponse });
    }

    const data = await erpResponse.json().catch((jsonError) => {
      throw new Error("Invalid response from Etendo Classic backend", { cause: jsonError });
    });

    storeCookieForToken(erpResponse, data);

    if (!erpResponse.ok) {
      return NextResponse.json({ error: data.error || "Login failed" }, { status: erpResponse.status });
    }
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return handleLoginError(error);
  }
}

/**
 * Handles errors in the login process and returns appropriate response
 */
function handleLoginError(error: unknown): NextResponse {
  console.error("API Route /api/auth/login Error:", error);

  const cause = error instanceof Error ? error.cause : null;

  const errorMessage = error instanceof Error ? error.message : "Internal Server Error";

  const statusCode = getErrorStatusCode(cause);

  return NextResponse.json({ error: errorMessage }, { status: statusCode });
}

/**
 * Extracts status code from error cause or defaults to 500
 */
function getErrorStatusCode(cause: unknown): number {
  if (cause && typeof cause === "object" && "status" in cause && typeof cause.status === "number") {
    return cause.status;
  }

  return 500;
}
