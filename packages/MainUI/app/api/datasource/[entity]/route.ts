import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/auth';
import { encodeDatasourcePayload } from '@/app/api/_utils/datasource';

async function handle(request: NextRequest, { params }: { params: { entity: string } }) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: 'Unauthorized - Missing Bearer token' }, { status: 401 });
    }

    const entity = params.entity;
    let erpUrl = `${process.env.ETENDO_CLASSIC_URL}/org.openbravo.service.datasource/${entity}`;

    // Append original query string if present
    const url = new URL(request.url);
    if (url.search) {
      erpUrl += url.search;
    }

    const method = request.method;
    const contentType = request.headers.get('Content-Type') || 'application/json';
    let body: string | undefined = method === 'GET' ? undefined : await request.text();

    // If client sent JSON but ERP expects form-urlencoded, convert
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${userToken}`,
      'Accept': 'application/json',
    };

    if (method !== 'GET' && body) {
      if (contentType.includes('application/json')) {
        try {
          const payload = JSON.parse(body);
          const encoded = encodeDatasourcePayload(payload);
          body = encoded.body;
          headers = { ...headers, ...encoded.headers };
        } catch {
          // Fall back to sending raw body with original content type
          headers['Content-Type'] = contentType;
        }
      } else {
        headers['Content-Type'] = contentType;
      }
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

export { handle as GET, handle as POST, handle as PUT, handle as DELETE, handle as PATCH };
