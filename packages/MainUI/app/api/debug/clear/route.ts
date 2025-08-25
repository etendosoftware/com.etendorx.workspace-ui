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

import { NextResponse } from "next/server";
import { clearDebugLogs } from "../../_utils/debugLogger";

export const runtime = "nodejs";

export async function POST() {
  // Only available in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Debug endpoint not available in production" }, { status: 404 });
  }

  try {
    clearDebugLogs();
    return NextResponse.json({ success: true, message: "Debug logs cleared" });
  } catch (error) {
    console.error("Failed to clear debug logs:", error);
    return NextResponse.json({ error: "Failed to clear logs" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}