import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { getCombinedErpCookieHeader } from "@/app/api/_utils/forwardConfig";
import { joinUrl } from "../../_utils/url";
import { withDebugLogging } from "../../_utils/debugLogger";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return withDebugLogging("/api/copilot/[...path]", async (request: NextRequest) => {
    try {
      // Extract user token for authentication with ERP
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

      // Build ERP URL with query parameters
      const url = new URL(request.url);
      const queryParams = url.search;
      const erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, `/copilot/${copilotPath}`) + queryParams;

      console.log("Copilot proxy request:", { erpUrl, userToken: !!userToken, hasBasicAuth });

      const headers: HeadersInit = {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      };

      // Use Bearer token auth if available, otherwise fall back to Basic auth
      if (userToken) {
        // Use the combined ERP cookie header that includes JSESSIONID for Bearer token auth
        const combinedCookie = getCombinedErpCookieHeader(request, userToken);
        if (combinedCookie) {
          headers.Cookie = combinedCookie;
        }
      } else if (hasBasicAuth && authHeader) {
        // Pass through Basic auth directly to ERP
        headers.Authorization = authHeader;
      }

      const response = await fetch(erpUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        console.log("Copilot request failed:", { status: response.status, statusText: response.statusText });
        const errorText = await response.text();
        return NextResponse.json({ error: errorText || "Copilot request failed" }, { status: response.status });
      }

      const data = await response.text();
      console.log("Copilot request successful");
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "application/json",
        },
      });
    } catch (error) {
      const resolvedParams = await params;
      console.error(`API Route /api/copilot/${resolvedParams.path.join("/")} Error:`, error);
      return NextResponse.json({ error: "Failed to fetch copilot data" }, { status: 500 });
    }
  }, request);
}
