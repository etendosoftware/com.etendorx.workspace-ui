import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";
import { getErpCsrfToken } from "../../_utils/sessionStore";

// Type definitions for better code clarity
interface ProcessedRequestData {
  headers: Record<string, string>;
  body?: string;
}

/**
 * Validates the incoming request and extracts the user token
 * @param request - The incoming Next.js request
 * @returns The user token or null if unauthorized
 */
function validateAndExtractToken(request: NextRequest): string | null {
  const userToken = extractBearerToken(request);
  if (!userToken) {
    return null;
  }
  return userToken;
}

/**
 * Builds the target ERP URL with query parameters
 * @param entity - The datasource entity name
 * @param requestUrl - The original request URL
 * @returns The complete ERP URL with query parameters
 */
function buildErpUrl(entity: string, requestUrl: URL, body?: string, userToken?: string | null): string {
  const baseUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/${entity}`;

  const params = new URLSearchParams(requestUrl.search);

  if (!body) {
    const csrfToken = getErpCsrfToken(userToken);
    params.set("csrfToken", csrfToken || "");
  }

  return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
}
/**
 * Processes the request body and headers for forwarding to the ERP system
 * @param request - The incoming Next.js request
 * @param userToken - The authenticated user token
 * @param combinedCookie - The combined cookie header
 * @param csrfToken - The CSRF token from the session store
 * @returns Processed headers and body for the ERP request
 */
async function processRequestData(
  request: NextRequest,
  userToken: string,
  combinedCookie: string,
  csrfToken: string | null
): Promise<ProcessedRequestData> {
  const method = request.method;
  const contentType = request.headers.get("Content-Type") || "application/json";

  // Base headers for all requests
  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    Accept: "application/json",
  };

  // Forward X-CSRF-Token header if present on the incoming request
  const csrf = request.headers.get("X-CSRF-Token");
  if (csrf) {
    headers["X-CSRF-Token"] = csrf;
  }

  // GET requests don't have a body
  if (method === "GET") {
    return { headers };
  }

  if (combinedCookie) {
    headers.Cookie = combinedCookie;
  }

  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const body = await request.text();

  // If no body content, return headers only
  if (!body) {
    return { headers };
  }

  // Process JSON body to sync csrfToken if needed
  let processedBody = body;
  if (contentType.includes("application/json") && csrfToken) {
    try {
      // replace csrfToken in the body
      processedBody = processedBody.replace(/"csrfToken":\s*".*?"/, `"csrfToken":"${csrfToken}"`);
    } catch (error) {
      // If JSON parsing fails, keep the original body
      console.warn("Failed to parse JSON body for CSRF token sync:", error);
    }
  } else {
    processedBody += `&csrfToken=${csrfToken}`;
  }

  headers["Content-Type"] = contentType;
  return { headers, body: processedBody };
}

/**
 * Handles the response from the ERP system and formats it for the client
 * @param response - The fetch response from the ERP system
 * @returns A Next.js response object
 */
async function handleErpResponse(response: Response): Promise<NextResponse> {
  const responseText = await response.text();

  // Attempt to parse as JSON first
  try {
    const jsonData = JSON.parse(responseText);
    return NextResponse.json(jsonData, { status: response.status });
  } catch {
    // If not valid JSON, return as plain text
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "text/plain",
      },
    });
  }
}

/**
 * Main request handler that orchestrates the datasource proxy functionality
 * @param request - The incoming Next.js request
 * @param context - Route context (contains params). Properly typed for Next.js 14+ compatibility.
 * @returns A Next.js response
 */
async function handle(request: NextRequest, context: { params: Promise<{ entity: string }> }) {
  try {
    // Step 1: Validate authentication
    const userToken = validateAndExtractToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    // Step 2: Extract entity and build target URL
    const { entity } = await context.params;
    const requestUrl = new URL(request.url);

    // Extract auth headers (cookie + CSRF token)
    const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken);
    // Step 3: Process request data for ERP compatibility
    const { headers, body } = await processRequestData(request, userToken, cookieHeader, csrfToken);
    const erpUrl = buildErpUrl(entity, requestUrl, body, userToken);

    // NOTE: Do not forward stored CSRF token as a header for datasource requests.
    // Datasource payloads include csrfToken in the request body when needed and
    // tests expect the X-CSRF-Token header to be absent here.

    // Step 4: Forward request to ERP system
    const erpResponse = await fetch(erpUrl, {
      method: request.method,
      headers,
      body,
    });

    // Step 5: Process and return the ERP response
    return await handleErpResponse(erpResponse);
  } catch (error) {
    console.error("Datasource proxy error:", error);
    return NextResponse.json({ error: "Failed to forward datasource request" }, { status: 500 });
  }
}

// Export the handler for all HTTP methods
export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
