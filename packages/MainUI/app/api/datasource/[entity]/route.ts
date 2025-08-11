import { NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/auth';
import { getCombinedErpCookieHeader, shouldPassthroughJson } from '@/app/api/_utils/forwardConfig';
import { encodeDatasourcePayload } from '@/app/api/_utils/datasource';

export const runtime = 'nodejs';

async function handle(request: Request, { params }: { params: { entity: string } }) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized - Missing Bearer token' }, { status: 401 });
    }

    const entity = params.entity;
    let erpUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/forward/org.openbravo.service.datasource/${entity}`;

    // Append original query string if present
    const url = new URL(request.url);
    if (url.search) {
      erpUrl += url.search;
    }

    const method = request.method;
    const contentType = request.headers.get('Content-Type') || 'application/json';
    let body: string | undefined = undefined;

    // If client sent JSON but ERP expects form-urlencoded, convert
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${userToken}`,
      'Accept': 'application/json',
    };
    const combinedCookie = getCombinedErpCookieHeader(request, userToken);
    if (combinedCookie) headers['Cookie'] = combinedCookie;

    if (method !== 'GET') {
      if (contentType.includes('application/json')) {
        // Optional passthrough: forward JSON as-is to match legacy behavior
        if (shouldPassthroughJson(request)) {
          body = await request.text();
          headers['Content-Type'] = contentType;
        } else {
          // Prefer robust text->JSON parse to support tests and environments
          const raw = await request.text();
          try {
            const payload = JSON.parse(raw);
            const encoded = encodeDatasourcePayload(payload);
            body = encoded.body;
            headers = { ...headers, ...encoded.headers };
            // Workaround backend bug: do not send Content-Type for form payloads
            delete headers['Content-Type'];
          } catch {
            // If not valid JSON, forward as-is
            body = raw;
            headers['Content-Type'] = contentType;
          }
        }
      } else {
        body = await request.text();
        // If client already sent application/x-www-form-urlencoded, avoid Content-Type header
        if (!contentType.includes('application/x-www-form-urlencoded')) {
          headers['Content-Type'] = contentType;
        }
      }
    }

    // Pass through CSRF header if sent by client
    const incomingCsrf = request.headers.get('X-CSRF-Token') || request.headers.get('x-csrf-token');
    if (incomingCsrf) {
      headers['X-CSRF-Token'] = incomingCsrf;
    }

    const response = await fetch(erpUrl, {
      method,
      headers,
      body,
    });

    const text = await response.text();
    // Try to parse JSON response; fall back to text
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
