import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getUserContext, extractBearerToken } from "@/lib/auth";
import { shouldCacheDatasource } from "@/app/api/_utils/datasourceCache";
import { shouldPassthroughJson, getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";
import { executeWithSessionRetry } from "@/app/api/_utils/sessionRetry";
import { getDatasourceUrl } from "../_utils/endpoints";
import type { DatasourceParams } from "@workspaceui/api-client/src/api/types";
import type { SmartClientPayload } from "@/app/api/_utils/datasource";

export const runtime = "nodejs";

// Union type for datasource parameters
type DatasourceRequestParams = DatasourceParams | SmartClientPayload;

// Cached function that includes the full user context in its key
const getCachedDatasource = unstable_cache(
  async (userToken: string, entity: string, params: DatasourceRequestParams) => {
    // For cached requests, get auth headers for the user token
    const { cookieHeader, csrfToken } = getErpAuthHeaders(userToken);
    return fetchDatasource(userToken, entity, params, cookieHeader, csrfToken);
  },
  ["datasource_v2"]
);

async function fetchDatasource(
  userToken: string,
  entity: string,
  params: DatasourceRequestParams,
  cookieHeader = "",
  csrfToken: string | null = null
) {
  // Use centralized endpoint configuration
  const operationType =
    (params as Record<string, unknown>)?._operationType || (params as Record<string, unknown>)?.operationType;
  const erpUrl = getDatasourceUrl(entity, typeof operationType === 'string' ? operationType : undefined);

  // Convert params object to URLSearchParams for the ERP request
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

  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(erpUrl, {
    method: "POST",
    headers,
    body: formData,
  });

  // Read body ONCE and reuse it (avoid double consumption of stream)
  const raw = await response.text();
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = { text: raw };
  }

  if (!response.ok) {
    // return a small wrapper so the caller can forward status and body
    return { response, data: parsed, __error: true, status: response.status, body: parsed } as const;
  }
  return { response, data: parsed } as const;
}

async function fetchDatasourceJson(
  userToken: string,
  entity: string,
  params: DatasourceRequestParams,
  cookieHeader = "",
  csrfToken: string | null = null
) {
  // Use centralized endpoint configuration
  const operationType =
    (params as Record<string, unknown>)?._operationType || (params as Record<string, unknown>)?.operationType;
  const erpUrl = getDatasourceUrl(entity, typeof operationType === 'string' ? operationType : undefined);

  // Process JSON body to sync csrfToken if needed
  let processedParams = params;
  if (csrfToken && params && typeof params === "object" && "csrfToken" in params) {
    processedParams = { ...params, csrfToken };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  const response = await fetch(erpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(processedParams),
  });

  // Read body ONCE and reuse it (avoid double consumption of stream)
  const raw = await response.text();
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    parsed = { text: raw };
  }

  if (!response.ok) {
    return { response, data: parsed, __error: true, status: response.status, body: parsed } as const;
  }
  return { response, data: parsed } as const;
}

function isSmartClientPayload(params: DatasourceRequestParams): params is SmartClientPayload {
  if (!params || typeof params !== "object") return false;
  const keys = Object.keys(params);
  return ["operationType", "data", "oldValues", "dataSource", "componentId", "csrfToken"].some((k) => keys.includes(k));
}

// Use shared extractor from auth utilities

export async function POST(request: NextRequest) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }
    // 1. Extract the full user context from the session
    const userContext = await getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: "Unauthorized - Missing user context" }, { status: 401 });
    }

    const { entity, params } = await request.json();
    if (!entity) {
      return NextResponse.json({ error: "Entity is required" }, { status: 400 });
    }

    // 2. Decide caching policy per-entity (disabled by default)
    const useCache = shouldCacheDatasource(entity, params);
    const contentType = request.headers.get("Content-Type") || "";
    const passJson =
      shouldPassthroughJson(request) && contentType.includes("application/json") && isSmartClientPayload(params);

    // For cached requests, use the existing flow without retry logic
    if (useCache) {
      const data = await getCachedDatasource(userToken, entity, params);
      return NextResponse.json(data);
    }

    // For non-cached requests, use session retry logic
    const requestFn = async (cookieHeader: string) => {
      // Get CSRF token for the current user token
      const { csrfToken } = getErpAuthHeaders(request, userToken);

      if (passJson) {
        return await fetchDatasourceJson(userToken, entity, params, cookieHeader, csrfToken);
      }
      return await fetchDatasource(userToken, entity, params, cookieHeader, csrfToken);
    };

    const result = await executeWithSessionRetry(request, userToken, requestFn);

    if (!result.success) {
      console.error("Datasource request failed:", result.error);
      return NextResponse.json({ error: result.error || "Failed to fetch data" }, { status: 500 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("API Route /api/datasource Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
