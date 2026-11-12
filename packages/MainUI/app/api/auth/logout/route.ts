export const runtime = "nodejs";
import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { logger } from "@/utils/logger";
import { handleLoginError } from "../../_utils/sessionErrors";
import { clearErpSessionCookie, getErpLoginSessionId } from "../../_utils/sessionStore";
import { joinUrl } from "../../_utils/url";

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

// Best-effort: a failure here must never block the local logout (state is already
// cleared client-side by the time this call happens). Token reuse after logout is
// closed only for requests going through com.etendoerp.metadata's /sws/*, per the
// backend's blacklist scope.
// The same call closes the Classic session registry entry (AD_Session) recorded at login, when known.
async function revokeTokenUpstream(userToken: string, loginSessionId: string | null): Promise<void> {
  try {
    const revokeUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/sws/com.etendoerp.metadata.meta/logout");
    await fetch(revokeUrl, buildRevokeRequest(userToken, loginSessionId));
  } catch (error) {
    logger.warn("Token revocation failed:", error);
  }
}

function buildRevokeRequest(userToken: string, loginSessionId: string | null): RequestInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${userToken}` };
  if (!loginSessionId) {
    return { method: "POST", headers };
  }

  headers["Content-Type"] = "application/json";
  return { method: "POST", headers, body: JSON.stringify({ sessionId: loginSessionId }) };
}

export async function POST(request: NextRequest) {
  try {
    const userToken = validateAndExtractToken(request);

    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    await revokeTokenUpstream(userToken, getErpLoginSessionId(userToken));
    clearErpSessionCookie(userToken);
    return new Response(null, { status: 200 });
  } catch (error) {
    return handleLoginError(error);
  }
}
