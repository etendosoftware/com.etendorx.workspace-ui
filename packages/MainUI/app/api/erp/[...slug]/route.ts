import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getUserContext, extractBearerToken, createUserContextHeaders } from '@/lib/auth';

// Cached function for generic ERP requests
const getCachedErpData = unstable_cache(
  async (userToken: string, slug: string, method: string, body: string, contentType: string, queryParams: string = '') => {
    let erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
    if (method === 'GET' && queryParams) {
      erpUrl += queryParams;
    }
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${userToken}`,
      'Accept': 'application/json',
    };

    // Only add Content-Type for requests with body
    if (method !== 'GET' && body) {
      headers['Content-Type'] = contentType;
    }
    
    const response = await fetch(erpUrl, {
      method: method, // Use the actual method instead of hardcoded POST
      headers,
      body: method === 'GET' ? undefined : body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ERP request failed for slug ${slug}: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    return response.json();
  },
  ['erp_logic_v1'] // Base key for this function
);

async function handleERPRequest(request: NextRequest, params: Promise<{ slug: string[] }>, method: string) {
  try {
    console.log(`API Route /api/erp/${(await params).slug.join('/')} - Method: ${method}`);
    // Extract user token for authentication with ERP
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized - Missing Bearer token' }, { status: 401 });
    }

    // Extract user context for cache isolation (optional for generic routes)
    const userContext = await getUserContext(request);
    
    const resolvedParams = await params;
    const slug = resolvedParams.slug.join('/');
    
    // Handle query parameters for GET requests
    let erpUrl = `${process.env.ETENDO_CLASSIC_URL}/${slug}`;
    if (method === 'GET') {
      const url = new URL(request.url);
      if (url.search) {
        erpUrl += url.search;
      }
    }
    
    const requestBody = method === 'GET' ? undefined : await request.text();
    const contentType = request.headers.get('Content-Type') || 'application/json';

    // For some routes we might want to bypass cache (e.g., mutations)
    const isMutationRoute = slug.includes('create') || slug.includes('update') || slug.includes('delete') || method !== 'GET';
    
    let data;
    if (isMutationRoute) {
      // Don't cache mutations or non-GET requests, make direct request
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${userToken}`,
        'Accept': 'application/json',
      };

      if (method !== 'GET' && requestBody) {
        headers['Content-Type'] = contentType;
      }

      // Add user context headers if available
      if (userContext) {
        Object.assign(headers, createUserContextHeaders(userContext));
      }

      const response = await fetch(erpUrl, {
        method,
        headers,
        body: requestBody,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `ERP request failed: ${response.status} ${response.statusText}` }, 
          { status: response.status }
        );
      }
      
      data = await response.json();
    } else {
      // Use cache for read operations (GET requests only)
      const queryParams = method === 'GET' ? new URL(request.url).search : '';
      data = await getCachedErpData(userToken, slug, method, requestBody || '', contentType, queryParams);
    }
    
    return NextResponse.json(data);
  } catch (error) {
    const resolvedParams = await params;
    console.error(`API Route /api/erp/${resolvedParams.slug.join('/')} Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch ERP data' }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, params, 'GET');
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, params, 'POST');
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, params, 'PUT');
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, params, 'DELETE');
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  return handleERPRequest(request, params, 'PATCH');
}