import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "../../_utils/forwardConfig";
import { SLUGS_CATEGORIES, SLUGS_METHODS } from "@/app/api/_utils/slug/constants";

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
    let erpUrl: string;
    const slugContainsCopilot = slug.includes(SLUGS_CATEGORIES.COPILOT);
    if (slugContainsCopilot) {
      erpUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/${slug}`;
    } else if (slug.startsWith(SLUGS_CATEGORIES.UTILITY)) {
      erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
    } else {
      erpUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/com.etendoerp.metadata.${slug}`;
    }

    if (method === "GET" && queryParams) {
      erpUrl += queryParams;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${userToken}`,
      Accept: slugContainsCopilot ? "text/event-stream" : "application/json",
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
      // NOTE: Handle ERP request errors
      // NOTE: use 404 for copilot to indicate not installed, otherwise use the actual response status
      const defaultResponseStatus = slugContainsCopilot ? 404 : response.status;
      const errorText = await response.text();
      throw new ErpRequestError({
        message: `ERP request failed for slug ${slug}: ${defaultResponseStatus} ${response.statusText}. ${errorText}`,
        status: defaultResponseStatus,
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
  return (
    slug.includes(SLUGS_METHODS.CREATE) ||
    slug.includes(SLUGS_METHODS.UPDATE) ||
    slug.includes(SLUGS_METHODS.DELETE) ||
    slug.includes(SLUGS_CATEGORIES.COPILOT) || // All copilot routes should bypass cache for real-time data
    slug.startsWith(SLUGS_CATEGORIES.NOTES) || // Notes servlet needs session cookies
    method !== "GET"
  );
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
    // NOTE: Handle ERP request errors
    // NOTE: use 404 for copilot to indicate not installed, otherwise use the actual response status
    const defaultResponseStatus = erpUrl.includes("copilot") ? 404 : response.status;
    const errorText = await response.text();
    throw new ErpRequestError({
      message: `ERP request failed: ${defaultResponseStatus} ${response.statusText}. ${errorText}`,
      status: defaultResponseStatus,
      statusText: response.statusText,
      errorText,
    });
  }

  const responseContentType = response.headers.get("content-type");
  if (responseContentType?.includes("text/event-stream")) {
    return { stream: response.body, headers: response.headers };
  }

  const responseText = await response.text();

  // Check if response is JavaScript error from Etendo
  if (responseText.startsWith("OB.KernelUtilities.handleSystemException(")) {
    // Extract error message from JavaScript
    const match = responseText.match(/OB\.KernelUtilities\.handleSystemException\('(.+)'\);/);
    const errorMessage = match ? match[1] : responseText;
    throw new Error(`Backend error: ${errorMessage}`);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON response from backend: ${responseText.substring(0, 200)}...`);
  }
}

async function handleERPRequest(request: Request, params: Promise<{ slug: string[] }>, method: string) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug.join("/");

    const userToken = extractBearerToken(request);
    if (!userToken) {
      return unauthorizedResponse();
    }

    const erpUrl = buildErpUrl(slug, request.url);
    const requestBody = await getRequestBody(request, method);
    const contentType = getContentType(request);

    const data = await fetchErpData({
      slug,
      method,
      userToken,
      erpUrl,
      request,
      requestBody,
      contentType,
    });

    if (isCopilotStream(slug, data)) {
      return handleStreamResponse(data as { stream: ReadableStream; headers: Headers });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleError(error, params);
  }
}

// Helper: Build ERP URL
function buildErpUrl(slug: string, requestUrl: string): string {
  let erpUrl: string;
  if (slug.startsWith(SLUGS_CATEGORIES.NOTES)) {
    // Notes servlet - simple direct path
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
  } else if (slug.startsWith(SLUGS_CATEGORIES.SWS)) {
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
  } else if (slug.startsWith(SLUGS_CATEGORIES.COPILOT)) {
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/${slug}`;
  } else if (slug.startsWith(SLUGS_CATEGORIES.UTILITY)) {
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
  } else {
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/com.etendoerp.metadata.${slug}`;
  }

  const url = new URL(requestUrl);
  erpUrl = erpUrl.replace(
    "sws/com.etendoerp.metadata.forward/org.openbravo.client.kernel",
    "org.openbravo.client.kernel"
  );
  erpUrl = erpUrl.replace("sws/com.etendoerp.metadata.meta/forward", "org.openbravo.client.kernel");

  if (url.search) {
    erpUrl += url.search;
  }

  return erpUrl;
}

// Helper: Get request body
async function getRequestBody(request: Request, method: string): Promise<string | undefined> {
  return method === "GET" ? undefined : await request.text();
}

// Helper: Get content type
function getContentType(request: Request): string {
  return request.headers.get("Content-Type") || "application/json";
}

// Helper: Fetch ERP data
async function fetchErpData({
  slug,
  method,
  userToken,
  erpUrl,
  request,
  requestBody,
  contentType,
}: {
  slug: string;
  method: string;
  userToken: string;
  erpUrl: string;
  request: Request;
  requestBody: string | undefined;
  contentType: string;
}): Promise<unknown> {
  if (isMutationRoute(slug, method)) {
    const headers = buildErpHeaders(userToken, request, method, requestBody, contentType, slug);
    return handleMutationRequest(erpUrl, method, headers, requestBody);
  }
  const queryParams = method === "GET" ? new URL(request.url).search : "";
  return getCachedErpData(userToken, slug, method, requestBody || "", contentType, queryParams);
}

// Helper: Check if response is a Copilot stream
function isCopilotStream(slug: string, data: unknown): boolean {
  return slug.includes(SLUGS_CATEGORIES.COPILOT) && typeof data === "object" && data !== null && "stream" in data;
}

// Helper: Handle stream response
function handleStreamResponse(data: { stream: ReadableStream; headers: Headers }): Response {
  return new Response(data.stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Helper: Handle unauthorized response
function unauthorizedResponse(): Response {
  return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
}

// Helper: Handle errors
async function handleError(error: unknown, params: Promise<{ slug: string[] }>): Promise<Response> {
  const resolvedParams = await params;
  console.error(`API Route /api/erp/${resolvedParams.slug.join("/")} Error:`, error);
  const errorStatus = error instanceof ErpRequestError ? error.status : 500;
  return NextResponse.json({ error: "Failed to fetch ERP data" }, { status: errorStatus });
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
