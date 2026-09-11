export const runtime = "nodejs";
import { type NextRequest, NextResponse } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { logger } from "@/utils/logger";
import { handleLoginError } from "../../_utils/sessionErrors";
import { clearErpSessionCookie } from "../../_utils/sessionStore";
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
async function revokeTokenUpstream(userToken: string): Promise<void> {
  try {
    const revokeUrl = joinUrl(process.env.ETENDO_CLASSIC_URL, "/sws/com.etendoerp.metadata.meta/logout");
    await fetch(revokeUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
    });
  } catch (error) {
    logger.warn("Token revocation failed:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userToken = validateAndExtractToken(request);

    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    await revokeTokenUpstream(userToken);
    clearErpSessionCookie(userToken);
    return new Response(null, { status: 200 });
  } catch (error) {
    return handleLoginError(error);
  }
}
