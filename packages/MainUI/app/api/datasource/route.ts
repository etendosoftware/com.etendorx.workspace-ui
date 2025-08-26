import { type NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getUserContext, extractBearerToken } from "@/lib/auth";
import { shouldCacheDatasource } from "@/app/api/_utils/datasourceCache";
import { shouldPassthroughJson } from "@/app/api/_utils/forwardConfig";
import { executeWithSessionRetry } from "@/app/api/_utils/sessionRetry";
import { joinUrl } from "../_utils/url";
import type { DatasourceParams } from "@workspaceui/api-client/src/api/types";
import type { SmartClientPayload } from "@/app/api/_utils/datasource";

export const runtime = "nodejs";

// Union type for datasource parameters
type DatasourceRequestParams = DatasourceParams | SmartClientPayload;

// Cached function that includes the full user context in its key
const getCachedDatasource = unstable_cache(
  async (userToken: string, entity: string, params: DatasourceRequestParams) =>
    fetchDatasource(userToken, entity, params),
  ["datasource_v2"]
);

async function fetchDatasource(userToken: string, entity: string, params: DatasourceRequestParams, cookieHeader = "") {
  const erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, `/meta/forward/org.openbravo.service.datasource/${entity}`);

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

  const response = await fetch(erpUrl, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ERP Datasource request failed: ${response.statusText}`);
  }
  const data = await response.json();
  return { response, data };
}

async function fetchDatasourceJson(
  userToken: string,
  entity: string,
  params: DatasourceRequestParams,
  cookieHeader = ""
) {
  const erpUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, `/meta/forward/org.openbravo.service.datasource/${entity}`);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${userToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const response = await fetch(erpUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`ERP Datasource JSON request failed: ${response.statusText}`);
  }
  const data = await response.json();
  return { response, data };
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
      if (passJson) {
        return await fetchDatasourceJson(userToken, entity, params, cookieHeader);
      }
      return await fetchDatasource(userToken, entity, params, cookieHeader);
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
