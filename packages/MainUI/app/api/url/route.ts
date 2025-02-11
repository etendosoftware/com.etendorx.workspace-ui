const FALLBACK_URL = 'http://localhost:8080/etendo';

export function GET() {
  return Response.json({ url: process.env.NEXT_PUBLIC_API_BASE_URL || FALLBACK_URL });
}
