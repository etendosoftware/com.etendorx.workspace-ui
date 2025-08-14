import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { getCombinedErpCookieHeader } from "../../_utils/forwardConfig";

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
function buildErpUrl(entity: string, requestUrl: URL): string {
  const baseUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/${entity}`;

  // Preserve original query parameters from the request
  return requestUrl.search ? `${baseUrl}${requestUrl.search}` : baseUrl;
}

/**
 * Processes the request body and headers for forwarding to the ERP system
 * @param request - The incoming Next.js request
 * @param userToken - The authenticated user token
 * @returns Processed headers and body for the ERP request
 */
async function processRequestData(
  request: NextRequest,
  userToken: string,
  combinedCookie: string
): Promise<ProcessedRequestData> {
  const method = request.method;
  const contentType = request.headers.get("Content-Type") || "application/json";

  // Base headers for all requests
  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    Accept: "application/json",
  };

  // GET requests don't have a body
  if (method === "GET") {
    return { headers };
  }

  if (combinedCookie) {
    headers.Cookie = combinedCookie;
  }

  const body = await request.text();

  // If no body content, return headers only
  if (!body) {
    return { headers };
  }

  headers["Content-Type"] = contentType;
  return { headers, body };
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
 * @param context - Route context (contains params). Kept loosely typed to match Next export expectations.
 * @returns A Next.js response
 */
async function handle(request: NextRequest, context: any) {
  try {
    // Step 1: Validate authentication
    const userToken = validateAndExtractToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    // Step 2: Extract entity and build target URL
    const params = context?.params ?? {};
    const entity = params.entity as string;
    const requestUrl = new URL(request.url);
    const erpUrl = buildErpUrl(entity, requestUrl);

    const combinedCookie = getCombinedErpCookieHeader(request, userToken);
    // Step 3: Process request data for ERP compatibility
    const { headers, body } = await processRequestData(request, userToken, combinedCookie);

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
