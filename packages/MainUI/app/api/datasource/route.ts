import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getUserContext, extractBearerToken } from "@/lib/auth";
import { shouldCacheDatasource } from "@/app/api/_utils/datasourceCache";
import { shouldPassthroughJson, getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";
import { executeWithSessionAndCsrfRetry } from "@/app/api/_utils/sessionRetryWithCsrf";
import { getDatasourceUrl } from "../_utils/endpoints";
import type { DatasourceParams } from "@workspaceui/api-client/src/api/types";
import type { SmartClientPayload } from "@/app/api/_utils/datasource";

export const runtime = "nodejs";

// Union type for datasource parameters
type DatasourceRequestParams = DatasourceParams | SmartClientPayload;

// Type for datasource response
type DatasourceResponse = {
  response: Response;
  data: unknown;
  __error?: boolean;
  status?: number;
  body?: unknown;
};

// Common function to handle response parsing
function parseResponse(raw: string): unknown {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return { text: raw };
  }
}

// Common function to create error response
function createErrorResponse(response: Response, data: unknown): DatasourceResponse {
  return { response, data, __error: true, status: response.status, body: data } as const;
}

// Common function to create success response
function createSuccessResponse(response: Response, data: unknown): DatasourceResponse {
  return { response, data } as const;
}

// Common function to get operation type
function getOperationType(params: DatasourceRequestParams): string | undefined {
  const operationType =
    (params as Record<string, unknown>)?._operationType || (params as Record<string, unknown>)?.operationType;
  return typeof operationType === "string" ? operationType : undefined;
}

// Common function to create headers
function createHeaders(
  userToken: string,
  cookieHeader: string,
  csrfToken: string | null,
  contentType: string
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    "Content-Type": contentType,
  };

  if (contentType === "application/json") {
    headers.Accept = "application/json";
  }

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

// Cached function that includes the full user context in its key
const getCachedDatasource = unstable_cache(
  async (userToken: string, entity: string, params: DatasourceRequestParams) => {
    // For cached requests, get auth headers for the user token
    const { cookieHeader, csrfToken } = getErpAuthHeaders(userToken);
    return fetchDatasource(userToken, entity, params, cookieHeader, csrfToken);
  },
  ["datasource_v2"]
);

// Function to convert params to form data for non-JSON requests
function createFormData(params: DatasourceRequestParams): URLSearchParams {
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (key === "criteria" && Array.isArray(value)) {
      // Datasource expects a single JSON array string under 'criteria'
      const arrayStr = `[${value.join(",")}]`;
      formData.set("criteria", arrayStr);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, String(item));
      }
    } else if (typeof value !== "undefined" && value !== null) {
      formData.append(key, String(value));
    }
  }
  return formData;
}

async function fetchDatasource(
  userToken: string,
  entity: string,
  params: DatasourceRequestParams,
  cookieHeader = "",
  csrfToken: string | null = null
): Promise<DatasourceResponse> {
  const operationType = getOperationType(params);
  const erpUrl = getDatasourceUrl(entity, operationType);
  const headers = createHeaders(userToken, cookieHeader, csrfToken, "application/x-www-form-urlencoded");
  const formData = createFormData(params);

  const response = await fetch(erpUrl, {
    method: "POST",
    headers,
    body: formData,
  });

  const raw = await response.text();
  const parsed = parseResponse(raw);

  return response.ok ? createSuccessResponse(response, parsed) : createErrorResponse(response, parsed);
}

async function fetchDatasourceJson(
  userToken: string,
  entity: string,
  params: DatasourceRequestParams,
  cookieHeader = "",
  csrfToken: string | null = null
): Promise<DatasourceResponse> {
  const operationType = getOperationType(params);
  const erpUrl = getDatasourceUrl(entity, operationType);
  const headers = createHeaders(userToken, cookieHeader, csrfToken, "application/json");

  // Process JSON body to sync csrfToken if needed
  let processedParams = params;
  if (csrfToken && params && typeof params === "object" && "csrfToken" in params) {
    processedParams = { ...params, csrfToken };
  }

  const response = await fetch(erpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(processedParams),
  });

  const raw = await response.text();
  const parsed = parseResponse(raw);

  return response.ok ? createSuccessResponse(response, parsed) : createErrorResponse(response, parsed);
}

function isSmartClientPayload(params: DatasourceRequestParams): params is SmartClientPayload {
  if (!params || typeof params !== "object") return false;
  const keys = Object.keys(params);
  return ["operationType", "data", "oldValues", "dataSource", "componentId", "csrfToken"].some((k) => keys.includes(k));
}

// Function to validate authentication
async function validateAuth(
  request: NextRequest
): Promise<{ userToken: string; userContext: unknown; error?: NextResponse }> {
  const userToken = extractBearerToken(request);
  if (!userToken) {
    return {
      userToken: "",
      userContext: null,
      error: NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 }),
    };
  }

  const userContext = await getUserContext(request);
  if (!userContext) {
    return {
      userToken,
      userContext: null,
      error: NextResponse.json({ error: "Unauthorized - Missing user context" }, { status: 401 }),
    };
  }

  return { userToken, userContext };
}

// Function to validate request body
function validateRequestBody(body: unknown): { entity: string; params: DatasourceRequestParams; error?: NextResponse } {
  const { entity, params } = body as { entity?: string; params?: DatasourceRequestParams };
  if (!entity) {
    return {
      entity: "",
      params: {} as DatasourceRequestParams,
      error: NextResponse.json({ error: "Entity is required" }, { status: 400 }),
    };
  }
  return { entity, params: params || ({} as DatasourceRequestParams) };
}

// Function to determine request configuration
function getRequestConfig(request: NextRequest, params: DatasourceRequestParams) {
  const contentType = request.headers.get("Content-Type") || "";
  const passJson =
    shouldPassthroughJson(request) && contentType.includes("application/json") && isSmartClientPayload(params);
  return { passJson };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate authentication
    const authResult = await validateAuth(request);
    if (authResult.error) {
      return authResult.error;
    }
    const { userToken } = authResult;

    // 2. Validate request body
    const body = await request.json();
    const bodyResult = validateRequestBody(body);
    if (bodyResult.error) {
      return bodyResult.error;
    }
    const { entity, params } = bodyResult;

    // 3. Determine caching and request configuration
    const useCache = shouldCacheDatasource(entity, params);
    const { passJson } = getRequestConfig(request, params);

    // 4. Handle cached requests
    if (useCache) {
      const data = await getCachedDatasource(userToken, entity, params);
      return NextResponse.json(data);
    }

    // 5. Handle non-cached requests with session retry
    const requestFn = async (cookieHeader: string) => {
      const { csrfToken } = getErpAuthHeaders(request, userToken);
      return passJson
        ? await fetchDatasourceJson(userToken, entity, params, cookieHeader, csrfToken)
        : await fetchDatasource(userToken, entity, params, cookieHeader, csrfToken);
    };

    const result = await executeWithSessionAndCsrfRetry(request, userToken, requestFn);


    if (!result.success) {
      let errorContext: string;
      if (result.csrfRecovered) {
        errorContext = "after CSRF recovery";
      } else if (result.recovered) {
        errorContext = "after session recovery";
      } else {
        errorContext = "initial attempt";
      }

      console.error(`Datasource request failed (${errorContext}):`, result.error);
      return NextResponse.json({ error: result.error || "Failed to fetch data" }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("API Route /api/datasource Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
