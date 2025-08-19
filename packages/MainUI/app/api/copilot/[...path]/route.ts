import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { joinUrl } from "../../_utils/url";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    // Extract user token for authentication with ERP
    const userToken = extractBearerToken(request);

    const resolvedParams = await params;
    const copilotPath = resolvedParams.path.join("/");

    // Validate environment variables
    if (!process.env.ETENDO_CLASSIC_URL) {
      console.error("ETENDO_CLASSIC_URL environment variable is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, `/copilot/${copilotPath}`);

    console.log("Copilot proxy request:", { erpUrl, userToken: !!userToken });

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Use development auth for now, but could also use userToken if needed
    if (process.env.NODE_ENV === "production" && userToken) {
      headers.Authorization = `Bearer ${userToken}`;
    } else {
      headers.Authorization = `Basic ${btoa("admin:admin")}`;
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
}
