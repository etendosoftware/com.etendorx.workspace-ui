import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { extractBearerToken } from "@/lib/auth";
import { getCombinedErpCookieHeader } from "@/app/api/_utils/forwardConfig";

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
    const pathname = url.pathname;
    
    // Check if this is a kernel servlet request (process execution or defaults)
    const isKernelRequest = pathname.includes('/meta/forward/org.openbravo.client.kernel');
    const processId = params.get("processId");
    const windowId = params.get("windowId");
    const reportId = params.get("reportId");
    const actionHandler = params.get("_action");
    let erpUrl: string;
    
    
    if (isKernelRequest || (processId && method === "POST")) {
      // For process execution, use the kernel endpoint to match Classic Etendo pattern
      const baseUrl = process.env.ETENDO_CLASSIC_URL?.endsWith("/") 
        ? process.env.ETENDO_CLASSIC_URL.slice(0, -1) 
        : process.env.ETENDO_CLASSIC_URL;
      
      // Build kernel URL with required query parameters to match Classic pattern
      const kernelParams = new URLSearchParams();
      if (processId) {
        kernelParams.set("processId", processId);
      }
      
      if (windowId) {
        kernelParams.set("windowId", windowId);
      }
      
      if (reportId !== null && reportId !== undefined) {
        kernelParams.set("reportId", reportId);
      }
      
      // Use the provided action handler, with proper fallback logic
      let action: string;
      if (actionHandler) {
        action = actionHandler;
      } else if (isKernelRequest) {
        // For kernel requests without explicit action, use DefaultsProcessActionHandler
        action = "org.openbravo.client.application.process.DefaultsProcessActionHandler";
      } else {
        // For direct process execution, use ExecuteProcessActionHandler
        action = "org.openbravo.client.application.process.ExecuteProcessActionHandler";
      }
      kernelParams.set("_action", action);
      
      // Use direct kernel endpoint to match Classic Etendo behavior
      erpUrl = `${baseUrl}/org.openbravo.client.kernel?${kernelParams.toString()}`;
      
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

    let data: any;
    if (isMutation) {
      const headers: Record<string, string> = {
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        Connection: "keep-alive",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      };
      
      if (requestBody) {
        headers["Content-Type"] = "application/json;charset=UTF-8";
      }
      
      // Use the combined ERP cookie header that includes JSESSIONID
      const combinedCookie = getCombinedErpCookieHeader(request, userToken);
      
      if (combinedCookie) {
        headers["Cookie"] = combinedCookie;
      }
      
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
    console.error("API Route /api/erp Error:", error);
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
