import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getUserContext, extractBearerToken } from '@/lib/auth';
import { shouldCacheDatasource } from '@/app/api/_utils/datasourceCache';
import { getCombinedErpCookieHeader, shouldPassthroughJson } from '@/app/api/_utils/forwardConfig';

export const runtime = 'nodejs';

// Cached function that includes the full user context in its key
const getCachedDatasource = unstable_cache(
  async (userToken: string, entity: string, params: any) => fetchDatasource(userToken, entity, params),
  ['datasource_v2']
);

async function fetchDatasource(userToken: string, entity: string, params: any, cookieHeader = '') {
  const erpUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/${entity}`;

  // Convert params object to URLSearchParams for the ERP request
  const formData = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (key === 'criteria' && Array.isArray(value)) {
      // Datasource expects a single JSON array string under 'criteria'
      const arrayStr = `[${value.join(',')}]`;
      formData.set('criteria', arrayStr);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, String(item));
      }
    } else if (typeof value !== 'undefined' && value !== null) {
      formData.append(key, String(value));
    }
  }

  const response = await fetch(erpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ERP Datasource request failed: ${response.statusText}`);
  }
  return response.json();
}

async function fetchDatasourceJson(userToken: string, entity: string, params: any, cookieHeader = '') {
  const erpUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/${entity}`;

  const response = await fetch(erpUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`ERP Datasource JSON request failed: ${response.statusText}`);
  }
  return response.json();
}

function isSmartClientPayload(params: any): boolean {
  if (!params || typeof params !== 'object') return false;
  const keys = Object.keys(params);
  return ['operationType','data','oldValues','dataSource','componentId','csrfToken'].some(k => keys.includes(k));
}

// Use shared extractor from auth utilities

export async function POST(request: NextRequest) {
  try {
    const userToken = extractBearerToken(request);
    // 1. Extract the full user context from the session
    const userContext = await getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized - Missing user context' }, { status: 401 });
    }

    const { entity, params } = await request.json();
    if (!entity) {
      return NextResponse.json({ error: 'Entity is required' }, { status: 400 });
    }

    // 2. Decide caching policy per-entity (disabled by default)
    const useCache = shouldCacheDatasource(entity, params);
    const combinedCookie = getCombinedErpCookieHeader(request, userToken);
    const contentType = request.headers.get('Content-Type') || '';
    const passJson = shouldPassthroughJson(request) && contentType.includes('application/json') && isSmartClientPayload(params);
    const data = useCache
      ? await getCachedDatasource(userToken, entity, params)
      : passJson
        ? await fetchDatasourceJson(userToken, entity, params, combinedCookie)
        : await fetchDatasource(userToken, entity, params, combinedCookie);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route /api/datasource Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
