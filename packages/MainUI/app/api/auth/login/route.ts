import { type NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { setErpSessionCookie } from '@/app/api/_utils/sessionStore';

// Handle OPTIONS request for health check
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function validateEnvironment(): void {
  if (!process.env.ETENDO_CLASSIC_URL) {
    console.error('ETENDO_CLASSIC_URL environment variable is not set');
    throw new Error('Server configuration error');
  }
}

async function fetchErpLogin(erpLoginUrl: string, body: any): Promise<Response> {
  return fetch(erpLoginUrl, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(body),
  }).catch((fetchError) => {
    console.error('Fetch error - Etendo Classic backend not accessible:', fetchError);
    throw new Error('Etendo Classic backend is not accessible');
  });
}

function extractJSessionId(erpResponse: Response): string | null {
  const jsession: string | null = null;
  
  // Try to get JSESSIONID from set-cookie header
  const single = erpResponse.headers.get('set-cookie');
  if (single) {
    const match = single.match(/JSESSIONID=([^;]+)/);
    if (match) return match[1];
  }
  
  // Fallback: scan all headers for multiple Set-Cookie entries
  for (const [key, value] of erpResponse.headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      const match = value.match(/JSESSIONID=([^;]+)/);
      if (match) return match[1];
    }
  }
  
  return jsession;
}

function storeCookieForToken(erpResponse: Response, data: any): void {
  try {
    const jsession = extractJSessionId(erpResponse);
    if (jsession && data?.token) {
      const cookieHeader = `JSESSIONID=${jsession}`;
      setErpSessionCookie(data.token, cookieHeader);
    }
  } catch {
    // ignore extraction errors
  }
}

export async function POST(request: NextRequest) {
  try {
    validateEnvironment();

    const body = await request.json();
    const erpLoginUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/login`;
    
    console.log('Login proxy attempt:', { erpLoginUrl, body: { username: body.username } });

    const erpResponse = await fetchErpLogin(erpLoginUrl, body);

    const data = await erpResponse.json().catch((jsonError) => {
      console.error('JSON parse error:', jsonError);
      throw new Error('Invalid response from Etendo Classic backend');
    });

    storeCookieForToken(erpResponse, data);

    if (!erpResponse.ok) {
      console.log('ERP login failed:', { status: erpResponse.status, data });
      return NextResponse.json(
        { error: data.error || 'Login failed' }, 
        { status: erpResponse.status }
      );
    }

    console.log('Login successful');
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Route /api/auth/login Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}
