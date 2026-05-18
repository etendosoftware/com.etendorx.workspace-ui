/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License.
 * You may obtain a copy of the License at
 * https://github.com/etendosoftware/etendo_core/blob/main/legal/Etendo_license.txt
 * Software distributed under the License is distributed on an
 * "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing rights
 * and limitations under the License.
 * All portions are Copyright © 2021–2025 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { type NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
import { recoverSession } from "@/app/api/_utils/sessionRecovery";
import { extractBearerToken } from "@/lib/auth";

/**
 * POST /api/auth/recover
 *
 * Attempts to refresh the ERP JSESSIONID using the current JWT.
 * Called by the client-side auth retry handler when a 401/403 is received.
 * Returns 200 on success (with optional newToken if JWT was rotated),
 * or 503 if recovery failed (e.g., SWSConfig not yet initialized).
 */
export async function POST(request: NextRequest) {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }

  const result = await recoverSession(token);
  if (result.success) {
    return NextResponse.json({ success: true, newToken: result.newToken ?? null });
  }

  return NextResponse.json({ error: result.error ?? "Recovery failed" }, { status: 503 });
}
