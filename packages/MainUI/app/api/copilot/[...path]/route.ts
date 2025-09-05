import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";
import { joinUrl } from "../../_utils/url";
import { executeWithSessionRetry } from "../../_utils/sessionRetry";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleCopilotRequest(request, params, "GET");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleCopilotRequest(request, params, "POST");
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleCopilotRequest(request, params, "PUT");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleCopilotRequest(request, params, "DELETE");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleCopilotRequest(request, params, "PATCH");
}

async function handleCopilotRequest(request: NextRequest, params: Promise<{ path: string[] }>, method: string) {
  try {
    const userToken = extractBearerToken(request);

    // For development: allow Basic auth if no Bearer token provided
    const authHeader = request.headers.get("Authorization");
    const hasBasicAuth = authHeader?.startsWith("Basic ");

    if (!userToken && !hasBasicAuth) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token or Basic auth" }, { status: 401 });
    }

    const resolvedParams = await params;
    const copilotPath = resolvedParams.path.join("/");

    // Validate environment variables
    if (!process.env.ETENDO_CLASSIC_URL) {
      console.error("ETENDO_CLASSIC_URL environment variable is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const url = new URL(request.url);
    const queryParams = url.search;
    const erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, `/copilot/${copilotPath}`) + queryParams;

    // Get request body for POST/PUT/PATCH methods
    const requestBody = method !== "GET" ? await request.text() : undefined;

    // Use the same authentication approach as /api/erp
    const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken);
    console.log("Copilot proxy request:", {
      erpUrl,
      method,
      userToken: !!userToken,
      hasBasicAuth,
      hasBody: !!requestBody,
      cookiePresent: !!cookieHeader,
      cookieLength: cookieHeader?.length || 0,
      incomingCookies: request.headers.get("cookie")?.length || 0,
    });

    if (userToken) {
      const retryResult = await executeWithSessionRetry(request, userToken, async (cookieHeader) => {
        const headers: HeadersInit = {
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent":
            request.headers.get("User-Agent") ||
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
          "sec-ch-ua": '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"macOS"',
        };

        // Add Content-Type for requests with body
        if (requestBody) {
          const contentType = request.headers.get("Content-Type") || "application/json";
          headers["Content-Type"] = contentType;
        }

        // Use the same cookie-based authentication as /api/erp
        if (cookieHeader) {
          headers.Cookie = cookieHeader;
        }
        if (csrfToken) {
          headers["X-CSRF-Token"] = csrfToken;
        }

        const response = await fetch(erpUrl, {
          method,
          headers,
          body: requestBody,
          credentials: "include",
        });

        const data = await response.text();
        return { response, data };
      });

      if (!retryResult.success) {
        console.log("Copilot request failed:", { error: retryResult.error });
        return NextResponse.json({ error: retryResult.error || "Copilot request failed" }, { status: 500 });
      }

      console.log("Copilot request successful", { recovered: retryResult.recovered });

      // Try to parse as JSON, similar to what the original UI expects
      const responseData = retryResult.data || "";
      try {
        const jsonData = JSON.parse(responseData);
        return NextResponse.json(jsonData);
      } catch {
        // If not JSON, return as text with appropriate content type
        return new NextResponse(responseData, {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }
    }

    if (hasBasicAuth && authHeader) {
      const headers: HeadersInit = {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        "User-Agent": request.headers.get("User-Agent") || "EtendoWorkspaceUI/1.0",
        Authorization: authHeader,
      };

      // Add Content-Type for requests with body
      if (requestBody) {
        const contentType = request.headers.get("Content-Type") || "application/json";
        headers["Content-Type"] = contentType;
      }

      const response = await fetch(erpUrl, {
        method,
        headers,
        body: requestBody,
        credentials: "include",
      });

      if (!response.ok) {
        console.log("Copilot Basic auth request failed:", { status: response.status, statusText: response.statusText });
        const errorText = await response.text();
        return NextResponse.json({ error: errorText || "Copilot request failed" }, { status: response.status });
      }

      const data = await response.text();
      console.log("Copilot Basic auth request successful");

      // Try to parse as JSON for Basic auth too
      try {
        const jsonData = JSON.parse(data);
        return NextResponse.json(jsonData);
      } catch {
        return new NextResponse(data, {
          status: 200,
          headers: {
            "Content-Type": response.headers.get("Content-Type") || "text/plain",
          },
        });
      }
    }
  } catch (error) {
    const resolvedParams = await params;
    console.error(`API Route /api/copilot/${resolvedParams.path.join("/")} Error:`, error);
    return NextResponse.json({ error: "Failed to fetch copilot data" }, { status: 500 });
  }
}
