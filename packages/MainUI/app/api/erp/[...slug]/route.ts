import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { extractBearerToken } from "@/lib/auth";
import { joinUrl } from "../../_utils/url";
import { getErpAuthHeaders } from "../../_utils/forwardConfig";

// Custom error class for ERP requests
class ErpRequestError extends Error {
  public readonly status: number;
  public readonly statusText: string;
  public readonly slug: string;
  public readonly errorText: string;

  constructor({
    message,
    status,
    statusText,
    slug,
    errorText,
  }: { message: string; status: number; statusText: string; slug?: string; errorText: string }) {
    super(message);
    this.name = "ErpRequestError";
    this.status = status;
    this.statusText = statusText;
    this.slug = slug || "";
    this.errorText = errorText;
  }
}

// Cached function for generic ERP requests
const getCachedErpData = unstable_cache(
  async (userToken: string, slug: string, method: string, body: string, contentType: string, queryParams = "") => {
    let erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, slug);
    if (method === "GET" && queryParams) {
      erpUrl += queryParams;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${userToken}`,
      Accept: slug.includes("copilot") ? "text/event-stream" : "application/json",
    };

    if (method !== "GET" && body) {
      headers["Content-Type"] = contentType;
    }

    const response = await fetch(erpUrl, {
      method: method,
      headers,
      body: method === "GET" ? undefined : body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ErpRequestError({
        message: `ERP request failed for slug ${slug}: ${response.status} ${response.statusText}. ${errorText}`,
        status: response.status,
        statusText: response.statusText,
        slug,
        errorText,
      });
    }

    const responseContentType = response.headers.get("content-type");
    if (responseContentType?.includes("text/event-stream")) {
      return { stream: response.body, headers: response.headers };
    }

    return response.json();
  },
  ["erp_logic_v1"]
);

/**
 * Determines if a route should bypass caching (mutations or non-GET requests)
 * @param slug - The API slug path
 * @param method - HTTP method
 * @returns true if this is a mutation route that should not be cached
 */
function isMutationRoute(slug: string, method: string): boolean {
  return slug.includes("create") || slug.includes("update") || slug.includes("delete") || method !== "GET";
}

/**
 * Builds headers for ERP requests including auth and CSRF tokens
 * @param userToken - Bearer token for authentication
 * @param request - Original request for extracting ERP headers
 * @param method - HTTP method
 * @param requestBody - Request body (if any)
 * @param contentType - Content type header
 * @returns Headers object for the ERP request
 */
function buildErpHeaders(
  userToken: string,
  request: Request,
  method: string,
  requestBody: string | undefined,
  contentType: string,
  slug?: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    Accept: slug?.includes("copilot") ? "text/event-stream" : "application/json",
  };

  if (method !== "GET" && requestBody) {
    headers["Content-Type"] = contentType;
  }

  // Use the combined ERP auth headers (cookie + CSRF token)
  const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken);

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

/**
 * Handles mutation requests (non-cached) to the ERP system
 * @param erpUrl - Target ERP URL
 * @param method - HTTP method
 * @param headers - Request headers
 * @param requestBody - Request body
 * @returns Response data from ERP
 */
async function handleMutationRequest(
  erpUrl: string,
  method: string,
  headers: Record<string, string>,
  requestBody: string | undefined
): Promise<unknown> {
  const response = await fetch(erpUrl, {
    method,
    headers,
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ErpRequestError({
      message: `ERP request failed: ${response.status} ${response.statusText}. ${errorText}`,
      status: response.status,
      statusText: response.statusText,
      errorText,
    });
  }

  const responseContentType = response.headers.get("content-type");
  if (responseContentType?.includes("text/event-stream")) {
    return { stream: response.body, headers: response.headers };
  }

  return response.json();
}

async function handleERPRequest(request: Request, params: Promise<{ slug: string[] }>, method: string) {
  try {
    const resolvedParams = await params;
    console.log(`API Route /api/erp/${resolvedParams.slug.join("/")} - Method: ${method}`);

    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    const slug = resolvedParams.slug.join("/");

    let erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, slug);
    const url = new URL(request.url);
    if (url.search) {
      erpUrl += url.search;
    }

    const requestBody = method === "GET" ? undefined : await request.text();
    const contentType = request.headers.get("Content-Type") || "application/json";

    let data: unknown;
    if (isMutationRoute(slug, method)) {
      // Don't cache mutations or non-GET requests, make direct request
      const headers = buildErpHeaders(userToken, request, method, requestBody, contentType, slug);
      data = await handleMutationRequest(erpUrl, method, headers, requestBody);
    } else {
      const queryParams = method === "GET" ? new URL(request.url).search : "";
      data = await getCachedErpData(userToken, slug, method, requestBody || "", contentType, queryParams);
    }

    // Handle streaming responses for copilot
    if (slug.includes("copilot") && data && typeof data === "object" && "stream" in data) {
      const streamData = data as { stream: ReadableStream; headers: Headers };
      return new Response(streamData.stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const resolvedParams = await params;
    console.error(`API Route /api/erp/${resolvedParams.slug.join("/")} Error:`, error);
    const errorStatus = error instanceof ErpRequestError ? error.status : 500;
    return NextResponse.json({ error: "Failed to fetch ERP data" }, { status: errorStatus });
  }
}

export async function GET(request: Request, context: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, context.params, "GET");
}

export async function POST(request: Request, context: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, context.params, "POST");
}

export async function PUT(request: Request, context: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, context.params, "PUT");
}

export async function DELETE(request: Request, context: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, context.params, "DELETE");
}

export async function PATCH(request: Request, context: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, context.params, "PATCH");
}
