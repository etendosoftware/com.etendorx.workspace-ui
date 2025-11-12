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

/**
 * GET /api/config
 *
 * Returns runtime configuration from environment variables
 * This allows the client to get backend URLs dynamically at runtime
 */
export async function GET() {
  const config = {
    etendoClassicHost: process.env.ETENDO_CLASSIC_HOST || process.env.ETENDO_CLASSIC_URL || "",
  };

  // In production, cache for a reasonable time (5 minutes)
  // In development/debug mode, don't cache to allow quick changes
  const isDebugMode = process.env.DEBUG_MODE === "true";
  const cacheControl = isDebugMode
    ? "no-store, no-cache, must-revalidate, max-age=0"
    : "public, max-age=300, s-maxage=300";

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": cacheControl,
    },
  });
}
