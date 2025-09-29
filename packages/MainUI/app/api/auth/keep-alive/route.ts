import { type NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";
import { joinUrl } from "../../_utils/url";
import { handleLoginError } from "../../_utils/sessionErrors";

// Type definitions for better code clarity
export interface SessionValidationResponse {
  result: string;
  [key: string]: unknown;
}

interface ProcessedRequestHeaders {
  headers: Record<string, string>;
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
 * Processes the request headers for forwarding to the ERP system
 * @param userToken - The authenticated user token
 * @param cookieHeader - The combined cookie header
 * @param csrfToken - The CSRF token from the session store
 * @returns Processed headers for the ERP request
 */
function processRequestHeaders(userToken: string, cookieHeader: string): ProcessedRequestHeaders {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  return { headers };
}

/**
 * Builds the target ERP URL for session keepalive
 * @returns The complete ERP URL for keepalive requests
 */
function buildKeepAliveUrl(): string {
  return joinUrl(
    process.env.ETENDO_CLASSIC_URL,
    "/org.openbravo.client.kernel?IsAjaxCall=1&ignoreForSessionTimeout=1&_action=org.openbravo.client.application.AlertActionHandler"
  );
}

/**
 * Forwards the keepalive request to the ERP system
 * @param keepAliveUrl - The target URL for the keepalive request
 * @param headers - The processed headers for the request
 * @returns The response from the ERP system
 */
async function fetchKeepAlive(keepAliveUrl: string, headers: Record<string, string>): Promise<Response> {
  return fetch(keepAliveUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  }).catch((fetchError) => {
    console.error("Fetch error - Etendo Classic backend not accessible:", fetchError);
    throw new Error("Etendo Classic backend is not accessible");
  });
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
    const jsonData: SessionValidationResponse = JSON.parse(responseText);
    const responseStatus = response.status;

    if (response.headers.get("set-cookie")) {
      return NextResponse.json({ ...jsonData, result: "failed" }, { status: responseStatus });
    }
    return NextResponse.json(jsonData, { status: responseStatus });
  } catch {
    // If not valid JSON, return as plain text with error
    return NextResponse.json({ error: "Invalid response format from Etendo Classic" }, { status: 500 });
  }
}

/**
 * Main request handler that orchestrates the session keepalive functionality
 * @param request - The incoming Next.js request
 * @returns A Next.js response
 */
async function handle(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Validate authentication
    const userToken = validateAndExtractToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    // Step 2: Extract auth headers (cookie + CSRF token) using existing utility
    const { cookieHeader } = getErpAuthHeaders(request, userToken);

    if (!cookieHeader) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Step 3: Process request headers for ERP compatibility
    const { headers } = processRequestHeaders(userToken, cookieHeader);

    // Step 4: Build target URL
    const keepAliveUrl = buildKeepAliveUrl();

    // Step 5: Forward request to ERP system
    const erpResponse = await fetchKeepAlive(keepAliveUrl, headers);

    // Step 6: Process and return the ERP response
    return await handleErpResponse(erpResponse);
  } catch (error) {
    console.error("Keep-alive proxy error:", error);
    return handleLoginError(error);
  }
}

// Export the handler for POST method
export { handle as POST };
