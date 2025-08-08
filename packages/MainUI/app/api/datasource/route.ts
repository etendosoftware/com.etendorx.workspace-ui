import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getUserContext, extractBearerToken, type UserContext } from '@/lib/auth';

// Cached function that includes the full user context in its key
const getCachedDatasource = unstable_cache(
  async (userToken: string, entity: string, params: any) => {
    const erpUrl = `${process.env.ETENDO_CLASSIC_URL}/org.openbravo.service.datasource/${entity}`;

    // Convert params object to URLSearchParams for the ERP request
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
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
        'Accept': 'application/json'
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`ERP Datasource request failed: ${response.statusText}`);
    }
    return response.json();
  },
  ['datasource_v2'] // Base key for this cached function
);

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

    // 2. Call the cached function, passing the full context.
    // Next.js will create a unique key based on userContext, entity, and params.
    const data = await getCachedDatasource(userToken, entity, params);
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Route /api/datasource Error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
