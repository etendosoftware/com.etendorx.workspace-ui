import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { getCombinedErpCookieHeader } from "@/app/api/_utils/forwardConfig";
import { executeWithSessionRetry } from "@/app/api/_utils/sessionRetry";
import { joinUrl } from "../../_utils/url";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
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

    const url = new URL(request.url);
    const queryParams = url.search;
    const erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, `/copilot/${copilotPath}`) + queryParams;

    const combinedCookieDebug = userToken ? getCombinedErpCookieHeader(request, userToken) : null;
    console.log("Copilot proxy request:", {
      erpUrl,
      userToken: !!userToken,
      hasBasicAuth,
      cookiePresent: !!combinedCookieDebug,
      cookieLength: combinedCookieDebug?.length || 0,
      incomingCookies: request.headers.get("cookie")?.length || 0,
    });

    if (userToken) {
      const retryResult = await executeWithSessionRetry(request, userToken, async (cookieHeader) => {
        const headers: HeadersInit = {
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          "User-Agent": request.headers.get("User-Agent") || "EtendoWorkspaceUI/1.0",
        };

        if (cookieHeader) {
          headers.Cookie = cookieHeader;
        }

        const response = await fetch(erpUrl, {
          method: "GET",
          headers,
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
      return new NextResponse(retryResult.data, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
    if (hasBasicAuth && authHeader) {
      const headers: HeadersInit = {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        "User-Agent": request.headers.get("User-Agent") || "EtendoWorkspaceUI/1.0",
        Authorization: authHeader,
      };

      const response = await fetch(erpUrl, {
        method: "GET",
        headers,
        credentials: "include",
      });

      if (!response.ok) {
        console.log("Copilot Basic auth request failed:", { status: response.status, statusText: response.statusText });
        const errorText = await response.text();
        return NextResponse.json({ error: errorText || "Copilot request failed" }, { status: response.status });
      }

      const data = await response.text();
      console.log("Copilot Basic auth request successful");
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "text/plain",
        },
      });
    }
  } catch (error) {
    const resolvedParams = await params;
    console.error(`API Route /api/copilot/${resolvedParams.path.join("/")} Error:`, error);
    return NextResponse.json({ error: "Failed to fetch copilot data" }, { status: 500 });
  }
}
