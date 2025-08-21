import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { extractBearerToken } from "@/lib/auth";

// Cached function for ERP requests to the base URL (no slug)
const getCachedErpData = unstable_cache(
  async (userToken: string, method: string, body: string, contentType: string, queryParams = "") => {
    let erpUrl = `${process.env.ETENDO_CLASSIC_URL}`;
    if (method === "GET" && queryParams) {
      erpUrl += queryParams;
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${userToken}`,
      Accept: "application/json",
    };

    if (method !== "GET" && body) {
      headers["Content-Type"] = contentType;
    }

    const response = await fetch(erpUrl, {
      method,
      headers,
      body: method === "GET" ? undefined : body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ERP request failed (base): ${response.status} ${response.statusText}. ${errorText}`);
    }

    return response.json();
  },
  ["erp_base_v1"]
);

async function handleERPBaseRequest(request: NextRequest, method: string) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    // Build ERP URL with query string for GET requests
    const url = new URL(request.url);
    const params = url.searchParams;
    
    // Check if this is a process execution request
    const processId = params.get("processId");
    let erpUrl: string;
    
    if (processId && method === "POST") {
      // For process execution, use the kernel forward endpoint with appropriate ActionHandler
      const baseUrl = process.env.ETENDO_CLASSIC_URL?.endsWith("/") 
        ? process.env.ETENDO_CLASSIC_URL.slice(0, -1) 
        : process.env.ETENDO_CLASSIC_URL;
      
      // Build kernel URL with required query parameters
      const kernelParams = new URLSearchParams();
      kernelParams.set("processId", processId);
      kernelParams.set("_action", "org.openbravo.client.application.process.ExecuteProcessActionHandler");
      
      erpUrl = `${baseUrl}/meta/forward/org.openbravo.client.kernel?${kernelParams.toString()}`;
    } else {
      // Default: base ERP URL
      erpUrl = `${process.env.ETENDO_CLASSIC_URL}`;
      // Special-case: kernel forward endpoints invoked via query _action
      const action = params.get("_action");
      if (action === "org.openbravo.client.application.window.FormInitializationComponent") {
        const baseUrl = process.env.ETENDO_CLASSIC_URL?.endsWith("/") 
          ? process.env.ETENDO_CLASSIC_URL.slice(0, -1) 
          : process.env.ETENDO_CLASSIC_URL;
        erpUrl = `${baseUrl}/meta/forward/org.openbravo.client.kernel`;
      }
      if (url.search) {
        erpUrl += url.search;
      }
    }

    let requestBody: string | undefined;
    let contentType = request.headers.get("Content-Type") || "application/json";
    
    if (method === "GET") {
      requestBody = undefined;
    } else {
      requestBody = await request.text();
    }

    // Mutations: direct fetch (no cache). Reads (GET): use cache
    const isMutation = method !== "GET";

    let data;
    if (isMutation) {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${userToken}`,
        Accept: "application/json",
      };
      if (requestBody) headers["Content-Type"] = contentType;

      const response = await fetch(erpUrl, {
        method,
        headers,
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ERP request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
        return NextResponse.json(
          { error: `ERP request failed: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }
      
      // Try to parse JSON, but handle cases where response is not JSON
      const responseText = await response.text();
      console.log(`ERP Response: ${responseText.substring(0, 200)}...`); // Log first 200 chars for debugging
      
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error(`Failed to parse ERP response as JSON: ${jsonError}. Response: ${responseText}`);
        // If it's not JSON, return the text response wrapped in a structure
        data = { success: true, message: responseText };
      }
    } else {
      const queryParams = new URL(request.url).search;
      data = await getCachedErpData(userToken, method, requestBody || "", contentType, queryParams);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`API Route /api/erp Error:`, error);
    return NextResponse.json({ error: "Failed to fetch ERP data" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleERPBaseRequest(request, "GET");
}

export async function POST(request: NextRequest) {
  return handleERPBaseRequest(request, "POST");
}

export async function PUT(request: NextRequest) {
  return handleERPBaseRequest(request, "PUT");
}

export async function DELETE(request: NextRequest) {
  return handleERPBaseRequest(request, "DELETE");
}

export async function PATCH(request: NextRequest) {
  return handleERPBaseRequest(request, "PATCH");
}
