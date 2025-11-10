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
    slug.startsWith(SLUGS_CATEGORIES.LEGACY) || // Legacy servlets return HTML and need session cookies
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

// Helper: Detect charset from Content-Type header
function detectCharset(contentType: string | null): string {
  if (!contentType) {
    return "iso-8859-1"; // Default for Tomcat legacy servlets
  }
  const charsetMatch = contentType.match(/charset=([^\s;]+)/i);
  return charsetMatch ? charsetMatch[1].toLowerCase() : "iso-8859-1";
}

// Helper: Check if response is binary file
function isBinaryContentType(contentType: string): boolean {
  return (
    contentType.includes("application/octet-stream") ||
    contentType.includes("application/zip") ||
    contentType.includes("image/") ||
    contentType.includes("video/") ||
    contentType.includes("audio/") ||
    contentType.includes("application/pdf")
  );
}

// Helper: Rewrite HTML resource URLs to point to Tomcat
function rewriteHtmlResourceUrls(html: string): string {
  let rewritten = html;

  const backendUrl = process.env.ETENDO_CLASSIC_URL || "";
  // Use public host for client-side URLs (accessible from browser)
  // Falls back to ETENDO_CLASSIC_URL if not set (backward compatibility)
  const publicBackendHost = process.env.NEXT_PUBLIC_ETENDO_CLASSIC_HOST || backendUrl;

  // Rewrite absolute URLs that point to the backend server URL (server-side URL like host.docker.internal)
  // Replace with the public host URL that the browser can access
  // This handles the Docker scenario where server uses host.docker.internal but browser needs localhost
  if (backendUrl && publicBackendHost && backendUrl !== publicBackendHost) {
    // Escape special regex characters in the URL
    const escapedBackendUrl = backendUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Replace server backend URL with public host URL
    // Matches: "http://host.docker.internal:8080/etendo/path" -> "http://localhost:8080/etendo/path"
    const backendUrlRegex = new RegExp(escapedBackendUrl, "gi");
    rewritten = rewritten.replace(backendUrlRegex, publicBackendHost);
  }

  // Rewrite relative paths that reference Etendo resources to use public host
  rewritten = rewritten.replace(/(href|src|action)="(\.\.\/)*web\//gi, `$1="${publicBackendHost}/web/`);

  // Rewrite paths like href="../../org.openbravo.client.kernel/..." to use public host
  rewritten = rewritten.replace(
    /(href|src|action)="(\.\.\/)*org\.openbravo\./gi,
    `$1="${publicBackendHost}/org.openbravo.`
  );

  // Rewrite JavaScript variable baseDirectory to use public host
  // Matches patterns like: var baseDirectory = "../web/"; or baseDirectory = "../../web/";
  rewritten = rewritten.replace(
    /baseDirectory\s*=\s*["'](\.\.\/)*web\/["']/gi,
    `baseDirectory = "${publicBackendHost}/web/"`
  );

  // Rewrite relative paths in JavaScript strings (action URLs, etc.)
  // Matches patterns like: "../../../web/" in JavaScript context
  rewritten = rewritten.replace(/["'](\.\.\/){2,}web\//g, `"${publicBackendHost}/web/`);

  return rewritten;
}

// Helper: Create HTML response with proper headers
function createHtmlResponse(html: string, originalResponse: Response): Response {
  const htmlHeaders = new Headers(originalResponse.headers);
  if (!htmlHeaders.has("content-type")) {
    htmlHeaders.set("Content-Type", "text/html");
  }
  return new Response(html, {
    status: originalResponse.status,
    statusText: originalResponse.statusText,
    headers: htmlHeaders,
  });
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

  // Check if response is a stream
  if (responseContentType?.includes("text/event-stream")) {
    return { stream: response.body, headers: response.headers };
  }

  // Check if response is HTML (for iframes like About modal, legacy servlets, etc.)
  if (responseContentType?.toLowerCase().includes("text/html")) {
    // Read HTML content with proper encoding detection
    const htmlBuffer = await response.arrayBuffer();
    const encoding = detectCharset(responseContentType);
    const htmlText = new TextDecoder(encoding).decode(htmlBuffer);

    // Rewrite URLs to point through proxy
    const rewrittenHtml = rewriteHtmlResourceUrls(htmlText);
    const htmlResponse = createHtmlResponse(rewrittenHtml, response);

    return { htmlContent: htmlResponse };
  }

  // Check if response is a binary file (for downloads)
  if (responseContentType && isBinaryContentType(responseContentType)) {
    return { binaryFile: response };
  }

  // Read response with proper encoding detection
  const responseBuffer = await response.arrayBuffer();
  const encoding = detectCharset(responseContentType);
  const responseText = new TextDecoder(encoding).decode(responseBuffer);

  // Fallback: Check if response body looks like HTML (when Content-Type is missing)
  if (
    responseText.trim().toLowerCase().startsWith("<html") ||
    responseText.trim().toLowerCase().startsWith("<!doctype html")
  ) {
    const rewrittenHtml = rewriteHtmlResourceUrls(responseText);
    const htmlResponse = createHtmlResponse(rewrittenHtml, response);
    return { htmlContent: htmlResponse };
  }

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

    // Extract token from header or query parameter (for legacy routes)
    let userToken = extractBearerToken(request);

    // For legacy routes, also check query parameter
    if (!userToken && slug.startsWith(SLUGS_CATEGORIES.LEGACY)) {
      const url = new URL(request.url);
      userToken = url.searchParams.get("token");
    }

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
  if (slug.startsWith(SLUGS_CATEGORIES.NOTES)) {
    // Notes servlet - simple direct path
    erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
  } else if (slug.startsWith(SLUGS_CATEGORIES.LEGACY)) {
    erpUrl = `${process.env.NEXT_PUBLIC_ETENDO_CLASSIC_HOST}/${slug}`;
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

// Helper: Check if response is a binary file
function isBinaryFile(data: unknown): boolean {
  return typeof data === "object" && data !== null && "binaryFile" in data;
}

// Helper: Check if response is HTML content
function isHtmlContent(data: unknown): boolean {
  return typeof data === "object" && data !== null && "htmlContent" in data;
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

  return new Response(htmlContent.body, {
    status: htmlContent.status,
    statusText: htmlContent.statusText,
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
