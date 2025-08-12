import { NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/auth';
import { getCombinedErpCookieHeader, shouldPassthroughJson } from '@/app/api/_utils/forwardConfig';
import { encodeDatasourcePayload } from '@/app/api/_utils/datasource';

export const runtime = 'nodejs';

function buildErpUrl(entity: string, request: Request): string {
  let erpUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/${entity}`;
  
  const url = new URL(request.url);
  if (url.search) {
    erpUrl += url.search;
  }
  
  return erpUrl;
}

function buildHeaders(userToken: string, request: Request): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${userToken}`,
    'Accept': 'application/json',
  };
  
  const combinedCookie = getCombinedErpCookieHeader(request, userToken);
  if (combinedCookie) {
    headers['Cookie'] = combinedCookie;
  }
  
  return headers;
}

async function processRequestBody(request: Request, contentType: string): Promise<{ body: string | undefined; headers: Record<string, string> }> {
  const method = request.method;
  
  if (method === 'GET') {
    return { body: undefined, headers: {} };
  }

  const additionalHeaders: Record<string, string> = {};
  
  if (contentType.includes('application/json')) {
    const raw = await request.text();
    
    if (shouldPassthroughJson(request)) {
      additionalHeaders['Content-Type'] = contentType;
      return { body: raw, headers: additionalHeaders };
    }
    
    try {
      const payload = JSON.parse(raw);
      const encoded = encodeDatasourcePayload(payload);
      return { body: encoded.body, headers: encoded.headers };
    } catch {
      additionalHeaders['Content-Type'] = contentType;
      return { body: raw, headers: additionalHeaders };
    }
  }
  
  const body = await request.text();
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    additionalHeaders['Content-Type'] = contentType;
  }
  
  return { body, headers: additionalHeaders };
}

function addCsrfHeader(headers: Record<string, string>, request: Request): void {
  const incomingCsrf = request.headers.get('X-CSRF-Token') || request.headers.get('x-csrf-token');
  if (incomingCsrf) {
    headers['X-CSRF-Token'] = incomingCsrf;
  }
}

async function handle(request: Request, { params }: { params: { entity: string } }) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized - Missing Bearer token' }, { status: 401 });
    }

    const entity = params.entity;
    const erpUrl = buildErpUrl(entity, request);
    const contentType = request.headers.get('Content-Type') || 'application/json';
    
    const headers = buildHeaders(userToken, request);
    const { body, headers: bodyHeaders } = await processRequestBody(request, contentType);
    
    Object.assign(headers, bodyHeaders);
    addCsrfHeader(headers, request);

    const response = await fetch(erpUrl, {
      method: request.method,
      headers,
      body,
    });

    const text = await response.text();
    
    try {
      const json = JSON.parse(text);
      return NextResponse.json(json, { status: response.status });
    } catch {
      return new NextResponse(text, {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('Content-Type') || 'text/plain' },
      });
    }
  } catch (error) {
    console.error('API Route /api/datasource/[entity] Error:', error);
    return NextResponse.json({ error: 'Failed to forward datasource request' }, { status: 500 });
  }
}

export async function GET(request: Request, context: any) {
  return handle(request, context as { params: { entity: string } });
}

export async function POST(request: Request, context: any) {
  return handle(request, context as { params: { entity: string } });
}

export async function PUT(request: Request, context: any) {
  return handle(request, context as { params: { entity: string } });
}

export async function DELETE(request: Request, context: any) {
  return handle(request, context as { params: { entity: string } });
}

export async function PATCH(request: Request, context: any) {
  return handle(request, context as { params: { entity: string } });
}
