import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";

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

// Helper functions to reduce cognitive complexity

function normalizeBaseUrl(url: string | undefined): string {
  return url?.endsWith("/") ? url.slice(0, -1) : url || "";
}

function buildKernelUrl(
  baseUrl: string,
  processId: string | null,
  windowId: string | null,
  reportId: string | null,
  actionHandler: string | null,
  isKernelRequest: boolean
): string {
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

  // Determine action handler with fallback logic
  let action: string;
  if (actionHandler) {
    action = actionHandler;
  } else if (isKernelRequest) {
    action = "org.openbravo.client.application.process.DefaultsProcessActionHandler";
  } else {
    action = "org.openbravo.client.application.process.ExecuteProcessActionHandler";
  }
  kernelParams.set("_action", action);

  return `${baseUrl}/sws/com.smf.securewebservices.kernel/org.openbravo.client.kernel?${kernelParams.toString()}`;
}

function buildErpUrl(url: URL, params: URLSearchParams): string {
  const baseUrl = normalizeBaseUrl(process.env.ETENDO_CLASSIC_URL);
  const pathname = url.pathname;
  const isKernelRequest = pathname.includes("/sws/com.etendoerp.metadata.forward/org.openbravo.client.kernel");
  const processId = params.get("processId");
  const windowId = params.get("windowId");
  const reportId = params.get("reportId");
  const actionHandler = params.get("_action");

  // Check if this should use kernel endpoint
  if (isKernelRequest || (processId && url.pathname.includes("/api/erp"))) {
    return buildKernelUrl(baseUrl, processId, windowId, reportId, actionHandler, isKernelRequest);
  }

  // Handle FormInitializationComponent special case
  const action = params.get("_action");
  if (action === "org.openbravo.client.application.window.FormInitializationComponent") {
    return `${baseUrl}/sws/com.etendoerp.metadata.forward/org.openbravo.client.kernel${url.search}`;
  }

  // Default: base ERP URL with query params
  return `${baseUrl}/sws/com.smf.securewebservices.kernel/org.openbravo.client.kernel${url.search}`;
}

async function executeMutation(
  erpUrl: string,
  method: string,
  requestBody: string | undefined,
  request: NextRequest,
  userToken: string
): Promise<unknown> {
  const headers: Record<string, string> = {
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    Connection: "keep-alive",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
  };

  if (requestBody) {
    headers["Content-Type"] = "application/json;charset=UTF-8";
  }

  // Use the combined ERP auth headers (cookie + CSRF token)
  const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken);

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
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`ERP request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
    throw new Error(`ERP request failed: ${response.status} ${response.statusText}`);
  }

  // Try to parse JSON, but handle cases where response is not JSON
  const responseText = await response.text();
  try {
    return JSON.parse(responseText);
  } catch (jsonError) {
    console.error(`Failed to parse ERP response as JSON: ${jsonError}. Response: ${responseText}`);
    return { success: true, message: responseText };
  }
}

async function handleERPBaseRequest(request: NextRequest, method: string) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const params = url.searchParams;
    const erpUrl = buildErpUrl(url, params);

    const requestBody = method === "GET" ? undefined : await request.text();
    const contentType = request.headers.get("Content-Type") || "application/json";
    const isMutation = method !== "GET";

    let data: unknown;
    if (isMutation) {
      data = await executeMutation(erpUrl, method, requestBody, request, userToken);
    } else {
      const queryParams = url.search;
      data = await getCachedErpData(userToken, method, requestBody || "", contentType, queryParams);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API Route /api/erp Error:", error);

    // Handle specific error types
    if (error instanceof Error && error.message.includes("ERP request failed")) {
      const statusMatch = error.message.match(/(\d{3})/);
      const status = statusMatch ? Number.parseInt(statusMatch[1]) : 500;
      return NextResponse.json({ error: error.message }, { status });
    }

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
