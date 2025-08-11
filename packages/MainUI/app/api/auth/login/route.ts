import { NextRequest, NextResponse } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.ETENDO_CLASSIC_URL) {
      console.error('ETENDO_CLASSIC_URL environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' }, 
        { status: 500 }
      );
    }

    const body = await request.json();
    const erpLoginUrl = `${process.env.ETENDO_CLASSIC_URL}/meta/login`;
    
    console.log('Login proxy attempt:', { erpLoginUrl, body: { username: body.username } });

    // Proxy the login request to the ERP without authentication
    const erpResponse = await fetch(erpLoginUrl, {
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

    const data = await erpResponse.json().catch((jsonError) => {
      console.error('JSON parse error:', jsonError);
      throw new Error('Invalid response from Etendo Classic backend');
    });

    // Capture ERP session cookie (e.g., JSESSIONID) and store it keyed by returned token
    try {
      let jsession: string | null = null;
      const single = erpResponse.headers.get('set-cookie');
      if (single) {
        const m = single.match(/JSESSIONID=([^;]+)/);
        if (m) jsession = m[1];
      }
      // Fallback: scan all headers for multiple Set-Cookie entries if runtime collapses differently
      if (!jsession) {
        for (const [k, v] of erpResponse.headers.entries()) {
          if (k.toLowerCase() === 'set-cookie') {
            const m = v.match(/JSESSIONID=([^;]+)/);
            if (m) { jsession = m[1]; break; }
          }
        }
      }
      if (jsession && data?.token) {
        const cookieHeader = `JSESSIONID=${jsession}`;
        setErpSessionCookie(data.token, cookieHeader);
      }
    } catch {
      // ignore extraction errors
    }

    if (!erpResponse.ok) {
      console.log('ERP login failed:', { status: erpResponse.status, data });
      return NextResponse.json(
        { error: data.error || 'Login failed' }, 
        { status: erpResponse.status }
      );
    }

    // Return successful login response
    console.log('Login successful');
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('API Route /api/auth/login Error:', error);
    
    // Return specific error message if available
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    
    return NextResponse.json(
      { error: errorMessage }, 
      { status: 500 }
    );
  }
}
