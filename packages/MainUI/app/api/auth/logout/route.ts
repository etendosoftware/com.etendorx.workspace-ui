export const runtime = "nodejs";
import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { handleLoginError } from "../../_utils/sessionErrors";
import { clearErpSessionCookie } from "../../_utils/sessionStore";

/**
 * Validates the incoming request and extracts the user token
 * @param request - The incoming Next.js request
 * @returns The user token or null if unauthorized
 */
function validateAndExtractToken(request: NextRequest): string | null {
  const userToken = extractBearerToken(request);
  if (!userToken) {
    return null;
  }
  return userToken;
}

export async function POST(request: NextRequest) {
  try {
    const userToken = validateAndExtractToken(request);

    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    clearErpSessionCookie(userToken);
    return new Response(null, { status: 200 });
  } catch (error) {
    return handleLoginError(error);
  }
}
