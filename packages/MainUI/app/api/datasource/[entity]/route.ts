import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";
import { shouldAttemptCsrfRecovery } from "@/app/api/_utils/sessionValidator";
import { recoverFromCsrfError } from "@/app/api/_utils/csrfRecovery";
import { getErpCsrfToken } from "../../_utils/sessionStore";
import { getDatasourceUrl } from "../../_utils/endpoints";

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
  const params = new URLSearchParams(requestUrl.search);
  const operationType = params.get("_operationType");

  // Use centralized endpoint configuration
  const baseUrl = getDatasourceUrl(entity, operationType || undefined);

  if (operationType && !params.has("_startRow") && !params.has("_endRow")) {
    params.set("_startRow", "0");
    params.set("_endRow", "75");
  }

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
 * @param requestBody - The request body (already extracted to avoid multiple reads)
 * @returns Processed headers and body for the ERP request
 */
async function processRequestData(
  request: NextRequest,
  userToken: string,
  combinedCookie: string,
  csrfToken: string | null,
  requestBody: string
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

  const body = requestBody || "";

  // If no body content, return headers only
  if (!body) {
    return { headers };
  }

  // Process JSON body to sync csrfToken if needed
  let processedBody = body;
  if (contentType.includes("application/json") && csrfToken) {
    try {
      // For JSON content, try to insert/replace csrfToken in the body
      if (processedBody.includes('"csrfToken"')) {
        processedBody = processedBody.replace(/"csrfToken":\s*".*?"/, `"csrfToken":"${csrfToken}"`);
      } else {
        // If csrfToken is not present, parse and add it
        const bodyObj = JSON.parse(processedBody);
        bodyObj.csrfToken = csrfToken;
        processedBody = JSON.stringify(bodyObj);
      }
    } catch (error) {
      // If JSON parsing fails, keep the original body
      console.warn("Failed to parse JSON body for CSRF token sync:", error);
    }
  } else if (processedBody && csrfToken) {
    // For form data, append as query parameter
    processedBody += `&csrfToken=${csrfToken}`;
  }

  headers["Content-Type"] = contentType;
  return { headers, body: processedBody };
}

/**
 * Handles the response from the ERP system with CSRF recovery capability
 * @param response - The fetch response from the ERP system
 * @param responseText - The response text (already consumed from response)
 * @param userToken - The JWT token for CSRF recovery
 * @returns A Next.js response object or recovery information
 */
async function handleErpResponseWithCsrfRecovery(
  response: Response,
  responseText: string,
  userToken: string
): Promise<{ nextResponse?: NextResponse; shouldRetry?: boolean; error?: string }> {
  // Attempt to parse as JSON first
  let jsonData: unknown;
  try {
    jsonData = JSON.parse(responseText);
  } catch {
    // If not valid JSON, return as plain text - no CSRF recovery possible
    return {
      nextResponse: new NextResponse(responseText, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "text/plain",
        },
      })
    };
  }

  // Check for CSRF error and attempt recovery
  if (shouldAttemptCsrfRecovery(response, jsonData)) {
    const csrfRecoveryResult = await recoverFromCsrfError(response, jsonData, userToken);

    if (csrfRecoveryResult.success) {
      return { shouldRetry: true };
    } else {
      return {
        error: `CSRF recovery failed: ${csrfRecoveryResult.error}`,
        nextResponse: NextResponse.json(jsonData, { status: response.status })
      };
    }
  }

  // No CSRF error, return normal response
  return {
    nextResponse: NextResponse.json(jsonData, { status: response.status })
  };
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

    // Extract request body once
    const requestBody = await request.text();

    // Step 3: Process request data for ERP compatibility
    const { headers, body } = await processRequestData(request, userToken, cookieHeader, csrfToken, requestBody);
    const erpUrl = buildErpUrl(entity, requestUrl, body, userToken);

    // Step 4: Forward request to ERP system
    const erpResponse = await fetch(erpUrl, {
      method: request.method,
      headers,
      body,
    });

    // Step 5: Process ERP response with CSRF recovery capability
    const erpResponseText = await erpResponse.text();
    const responseResult = await handleErpResponseWithCsrfRecovery(erpResponse, erpResponseText, userToken);

    if (responseResult.shouldRetry) {
      // Retry the request with updated session
      const { cookieHeader: newCookieHeader, csrfToken: newCsrfToken } = getErpAuthHeaders(request, userToken);
      const { headers: retryHeaders, body: retryBody } = await processRequestData(
        request,
        userToken,
        newCookieHeader,
        newCsrfToken,
        requestBody
      );
      const retryErpUrl = buildErpUrl(entity, requestUrl, retryBody, userToken);

      const retryResponse = await fetch(retryErpUrl, {
        method: request.method,
        headers: retryHeaders,
        body: retryBody,
      });

      // Handle retry response (no further CSRF recovery to prevent loops)
      const retryResponseText = await retryResponse.text();
      const retryResult = await handleErpResponseWithCsrfRecovery(retryResponse, retryResponseText, userToken);
      return retryResult.nextResponse || NextResponse.json({ error: "Retry failed" }, { status: 500 });
    }

    if (responseResult.error) {
      console.error("CSRF recovery error:", responseResult.error);
    }

    return responseResult.nextResponse!;
  } catch (error) {
    console.error("Datasource proxy error:", error);
    return NextResponse.json({ error: "Failed to forward datasource request" }, { status: 500 });
  }
}

// Export the handler for all HTTP methods
export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
