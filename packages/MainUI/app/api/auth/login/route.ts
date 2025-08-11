import { NextRequest, NextResponse } from 'next/server';

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
    });

    const data = await erpResponse.json();

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
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}