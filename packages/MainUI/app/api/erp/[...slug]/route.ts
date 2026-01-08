import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "../../_utils/forwardConfig";
import { SLUGS_CATEGORIES, SLUGS_METHODS, URL_MUTATION } from "@/app/api/_utils/slug/constants";
import { detectCharset, isBinaryContentType, createHtmlResponse, rewriteHtmlResourceUrls } from "./route.helpers";

type requestBody = string | ReadableStream<Uint8Array> | undefined;
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
    } else if (slug.startsWith(SLUGS_CATEGORIES.ATTACHMENTS) || slug.startsWith(SLUGS_CATEGORIES.NOTES)) {
      erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
    } else {
      erpUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/com.etendoerp.metadata.${slug}`;
    }

    if (method === "GET" && queryParams) {
      erpUrl += queryParams;
    }

    // Get ERP auth headers including Cookie from sessionStore
    const authHeaders = getErpAuthHeaders(userToken);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${userToken}`,
      Accept: slugContainsCopilot ? "text/event-stream" : "application/json",
    };

    // Add Cookie header if available (includes JSESSIONID from sessionStore)
    if (authHeaders.cookieHeader) {
      headers.Cookie = authHeaders.cookieHeader;
    }

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
    slug.startsWith(SLUGS_CATEGORIES.ATTACHMENTS) || // Attachments servlet needs session cookies and multipart/form-data
    slug.startsWith(SLUGS_CATEGORIES.LEGACY) || // Legacy servlets need session cookies
    // Static resources and direct handling
    slug.startsWith("web/") ||
    slug.startsWith("ad_forms/") ||
    slug.startsWith("org.openbravo") ||
    slug.startsWith("etendo/") ||
    method !== "GET"
  );
}

/** Determines if a URL should bypass caching (mutations or non-GET requests)
 * @param url - The full request URL
 * @returns true if this is a mutation URL that should not be cached
 */
function isMutationUrl(url: string): boolean {
  return url.includes(URL_MUTATION.COMPUTE_WINDOW) || url.includes(URL_MUTATION.CLONE_RECORDS);
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
  requestBody: requestBody,
  contentType: string,
  slug?: string
): Record<string, string> {
  // Determine Accept header based on slug
  let acceptHeader = "application/json";
  if (slug?.includes("copilot")) {
    acceptHeader = "text/event-stream";
  } else if (slug?.startsWith(SLUGS_CATEGORIES.LEGACY)) {
    acceptHeader = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    Accept: acceptHeader,
  };

  if (method !== "GET" && requestBody) {
    headers["Content-Type"] = contentType;
  }

  // Use the combined ERP auth headers (cookie + CSRF token)
  // Check for X-CSRF-Token in the incoming request headers first
  const requestCsrfToken = request.headers.get("X-CSRF-Token") || request.headers.get("x-csrf-token");
  const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken, requestCsrfToken);

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (csrfToken) {
    // Some endpoints expect X-CSRF-Token, others just CSRF-Token or X-Csrf-Token
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

/**
 * Handles mutation requests (non-cached) to the ERP system
 * @param erpUrl - Target ERP URL
 * @param method - HTTP method
 * @param headers - Request headers
 * @param requestBody - Request body (string or stream for multipart)
 * @returns Response data from ERP
 */
async function handleMutationRequest(
  erpUrl: string,
  method: string,
  headers: Record<string, string>,
  requestBody: requestBody
): Promise<unknown> {
  const fetchOptions: RequestInit = {
    method,
    headers,
    body: requestBody,
  };

  // Add duplex option only for ReadableStream bodies
  // Check for ReadableStream in a way that works in both Node.js and browser
  if (typeof ReadableStream !== "undefined" && requestBody instanceof ReadableStream) {
    // @ts-expect-error - duplex is required for streaming but not in types yet
    fetchOptions.duplex = "half";
  }

  const response = await fetch(erpUrl, fetchOptions);

  if (!response.ok) {
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

  // Check if response is a stream
  if (responseContentType?.includes("text/event-stream")) {
    return { stream: response.body, headers: response.headers };
  }

  // Check if response is a binary file (for downloads)
  if (responseContentType && isBinaryContentType(responseContentType)) {
    return { binaryFile: response };
  }

  // Read response with proper encoding detection
  const responseBuffer = await response.arrayBuffer();
  const encoding = detectCharset(responseContentType);
  const responseText = new TextDecoder(encoding).decode(responseBuffer);

  // Check if response is HTML (with proper encoding detection already applied)
  if (
    responseContentType?.toLowerCase().includes("text/html") ||
    responseText.trim().toLowerCase().startsWith("<html") ||
    responseText.trim().toLowerCase().startsWith("<!doctype html")
  ) {
    // Rewrite HTML to inject <base> tag pointing to ETENDO_CLASSIC_HOST
    // This allows relative paths on the client to resolve directly to the backend
    // Rewrite HTML to inject <base> tag pointing to ETENDO_CLASSIC_HOST
    // This allows relative paths on the client to resolve directly to the backend
    const rewrittenHtml = rewriteHtmlResourceUrls(
      responseText,
      process.env.ETENDO_CLASSIC_HOST || process.env.ETENDO_CLASSIC_URL
    );
    const htmlResponse = createHtmlResponse(rewrittenHtml, response);

    // For PrinterReports, also return Set-Cookie header so client can extract JSESSIONID
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      htmlResponse.headers.set("set-cookie", setCookie);
    }

    return { htmlContent: htmlResponse };
  }

  // Check if response is JavaScript error from Etendo
  if (responseText.startsWith("OB.KernelUtilities.handleSystemException(")) {
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

    if (isBinaryFile(data)) {
      return handleBinaryFileResponse(data as { binaryFile: Response });
    }

    if (isHtmlContent(data)) {
      return handleHtmlContentResponse(data as { htmlContent: Response });
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    return handleError(error, params);
  }
}

// Helper: Build ERP URL
function buildErpUrl(slug: string, requestUrl: string): string {
  let erpUrl: string;
  if (slug.startsWith(SLUGS_CATEGORIES.ATTACHMENTS) || slug.startsWith(SLUGS_CATEGORIES.NOTES)) {
    // Attachments servlet uses direct mapping (e.g., /attachments)
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
  } else if (slug.startsWith(SLUGS_CATEGORIES.LEGACY)) {
    // Legacy servlets use direct mapping (e.g., /meta/legacy/ad_forms/about.html)
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
  } else if (slug.startsWith(SLUGS_CATEGORIES.SWS)) {
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
  } else if (slug.startsWith(SLUGS_CATEGORIES.COPILOT)) {
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/sws/${slug}`;
  } else if (
    slug.startsWith("web/") ||
    slug.startsWith("ad_forms/") ||
    slug.startsWith("org.openbravo") ||
    slug.startsWith("etendo/")
  ) {
    // Direct mapping for static resources and other classic paths
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
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

// Helper: Get request body (preserves binary data for multipart/form-data)
async function getRequestBody(
  request: Request,
  method: string
): Promise<string | ReadableStream<Uint8Array> | undefined> {
  if (method === "GET") {
    return undefined;
  }

  const contentType = request.headers.get("Content-Type") || "";

  // For multipart/form-data (file uploads), preserve the binary stream
  if (contentType.includes("multipart/form-data")) {
    return request.body || undefined;
  }

  // For other content types, read as text
  return await request.text();
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
  requestBody: string | ReadableStream<Uint8Array> | undefined;
  contentType: string;
}): Promise<unknown> {
  if (isMutationRoute(slug, method) || isMutationUrl(erpUrl)) {
    const headers = buildErpHeaders(userToken, request, method, requestBody, contentType, slug);
    return handleMutationRequest(erpUrl, method, headers, requestBody);
  }
  const queryParams = method === "GET" ? new URL(request.url).search : "";
  // Cached requests only handle string bodies (not streams)
  const bodyString = typeof requestBody === "string" ? requestBody : "";
  return getCachedErpData(userToken, slug, method, bodyString, contentType, queryParams);
}

// Helper: Check if response is a Copilot stream
function isCopilotStream(slug: string, data: unknown): boolean {
  return slug.includes(SLUGS_CATEGORIES.COPILOT) && typeof data === "object" && data !== null && "stream" in data;
}

// Helper: Check if response is a binary file
function isBinaryFile(data: unknown): boolean {
  return typeof data === "object" && data !== null && "binaryFile" in data;
}

// Helper: Check if response is HTML content
function isHtmlContent(data: unknown): boolean {
  return typeof data === "object" && data !== null && "htmlContent" in data;
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

// Helper: Handle binary file response
function handleBinaryFileResponse(data: { binaryFile: Response }): Response {
  const { binaryFile } = data;
  return new Response(binaryFile.body, {
    headers: {
      "Content-Type": binaryFile.headers.get("content-type") || "application/octet-stream",
      "Content-Disposition": binaryFile.headers.get("content-disposition") || "attachment",
    },
  });
}

// Helper: Handle HTML content response (ensure UTF-8 charset)
function handleHtmlContentResponse(data: { htmlContent: Response }): Response {
  const { htmlContent } = data;
  const headers = new Headers(htmlContent.headers);

  // Ensure UTF-8 charset is explicitly set for HTML responses
  const contentType = headers.get("content-type") || "text/html";
  if (!contentType.includes("charset")) {
    headers.set("Content-Type", `${contentType}; charset=UTF-8`);
  }

  // Use standard status text to avoid "Parse Error: Expected HTTP/"
  const validStatusText = htmlContent.status === 200 ? "OK" : "Error";

  return new Response(htmlContent.body, {
    status: htmlContent.status,
    statusText: validStatusText,
    headers,
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
