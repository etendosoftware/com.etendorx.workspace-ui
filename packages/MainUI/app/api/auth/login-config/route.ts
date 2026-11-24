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
 * All portions are Copyright © 2021–2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */

import { NextResponse } from "next/server";
import { logger } from "@/utils/logger";
import { joinUrl } from "../../_utils/url";

/** Metadata endpoint, reachable before the login, with the System configuration of the login screen. */
const LOGIN_CONFIG_PATH = "/sws/com.etendoerp.metadata.meta/login-config";

/** Answer when the configuration cannot be read: the standard login, as classic with no preference. */
const STANDARD_LOGIN = { forcedLoginUrl: "" };

/**
 * GET /api/auth/login-config: the System configuration the login screen applies before the user logs in
 * (the classic `ForcedLoginURL` preference). Any failure answers the standard login, so the login page always
 * shows.
 */
export async function GET() {
  try {
    const response = await fetch(joinUrl(process.env.ETENDO_CLASSIC_URL, LOGIN_CONFIG_PATH), { method: "POST" });
    if (!response.ok) {
      return NextResponse.json(STANDARD_LOGIN);
    }
    const data = (await response.json()) as { forcedLoginUrl?: string };
    return NextResponse.json({ forcedLoginUrl: data.forcedLoginUrl ?? "" });
  } catch (error) {
    logger.warn("Could not read the login configuration:", error);
    return NextResponse.json(STANDARD_LOGIN);
  }
}
