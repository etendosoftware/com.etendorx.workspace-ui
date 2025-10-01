import { NextResponse } from "next/server";
export const runtime = "nodejs";

/**
 * Extracts status code from error cause or defaults to 500
 */
function getErrorStatusCode(cause: unknown): number {
  if (cause && typeof cause === "object" && "status" in cause && typeof cause.status === "number") {
    return cause.status;
  }

  return 500;
}

/**
 * Handles errors in the login process and returns appropriate response
 */
export function handleLoginError(error: unknown): NextResponse {
  console.error("API Route /api/auth Error:", error);

  const cause = error instanceof Error ? error.cause : null;

  const errorMessage = error instanceof Error ? error.message : "Internal Server Error";

  const statusCode = getErrorStatusCode(cause);

  return NextResponse.json({ error: errorMessage }, { status: statusCode });
}
