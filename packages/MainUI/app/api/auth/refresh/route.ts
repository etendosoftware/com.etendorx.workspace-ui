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

import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "../../_utils/forwardConfig";
import { handOffErpSession } from "../../_utils/erpSession";
import { handleLoginError } from "../../_utils/sessionErrors";
import { joinUrl } from "../../_utils/url";

/**
 * Renews the current JWT before it expires.
 *
 * `/sws/login` already re-issues a token when it receives a valid Bearer token and a body without
 * credentials, so no ERP change is needed. It cannot renew an *expired* token — the ERP verifies
 * `exp` first — so the client must call this proactively.
 */

const ERP_LOGIN_PATH = "/sws/login";
// Raised by the core when the resolved organization has no warehouse at all: SecureWebServicesUtils
// dereferences the warehouse without a guard. com.etendoerp.metadata tolerates it, so it is used as
// a fallback here for exactly the same reason /api/auth/login does.
const ORG_HAS_NO_WAREHOUSES_ERROR = "SMFSWS_OrgHasNoRole";
const ERP_CHANGE_PROFILE_PATH = "/sws/com.etendoerp.metadata.meta/change-profile";
const EMPTY_BODY = "{}";
const MISSING_TOKEN_ERROR = "Unauthorized - Missing Bearer token";
const REFRESH_FAILED_ERROR = "Token refresh failed";

function validateEnvironment(): void {
  if (!process.env.ETENDO_CLASSIC_URL) {
    console.error("ETENDO_CLASSIC_URL environment variable is not set");
    throw new Error("Server configuration error");
  }
}

function buildHeaders(userToken: string, cookieHeader: string, csrfToken: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${userToken}`,
  };

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

async function postToErp(path: string, headers: Record<string, string>): Promise<Response> {
  const url = joinUrl(process.env.ETENDO_CLASSIC_URL, path);

  return fetch(url, { method: "POST", headers, body: EMPTY_BODY }).catch((fetchError) => {
    console.error("Fetch error - Etendo API not accessible:", fetchError);
    throw new Error("Etendo API is not accessible");
  });
}

/**
 * Reads the ERP JSON body without throwing on a malformed/empty payload.
 */
async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  return response.json().catch(() => null);
}

/**
 * `/sws/login` reports failures as HTTP 200 with `{status: "error"}`, so a successful renewal is
 * only the case where the response is OK and actually carries a token.
 */
function isSuccessfulRenewal(response: Response, data: Record<string, unknown> | null): boolean {
  if (!response.ok) return false;
  if (!data) return false;
  if (data.status === "error") return false;

  return typeof data.token === "string" && data.token.length > 0;
}

function isOrgWithoutWarehouseError(data: Record<string, unknown> | null): boolean {
  return data?.message === ORG_HAS_NO_WAREHOUSES_ERROR;
}

type RenewalResult = { response: Response; data: Record<string, unknown> } | null;

/**
 * Renews through `/sws/login`, falling back to com.etendoerp.metadata's change-profile endpoint for
 * the one case the core cannot handle: an organization with no warehouses.
 *
 * @returns The successful ERP response and its parsed body, or null when the token could not be renewed
 */
async function renewToken(headers: Record<string, string>): Promise<RenewalResult> {
  const response = await postToErp(ERP_LOGIN_PATH, headers);
  const data = await readJson(response);

  if (isSuccessfulRenewal(response, data)) {
    return { response, data: data as Record<string, unknown> };
  }

  if (!isOrgWithoutWarehouseError(data)) {
    return null;
  }

  const fallbackResponse = await postToErp(ERP_CHANGE_PROFILE_PATH, headers);
  const fallbackData = await readJson(fallbackResponse);

  if (isSuccessfulRenewal(fallbackResponse, fallbackData)) {
    return { response: fallbackResponse, data: fallbackData as Record<string, unknown> };
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    validateEnvironment();

    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: MISSING_TOKEN_ERROR }, { status: 401 });
    }

    const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken);
    const renewal = await renewToken(buildHeaders(userToken, cookieHeader, csrfToken));

    if (!renewal) {
      // The session store is deliberately left untouched: a transient failure must not destroy the
      // JSESSIONID/CSRF of a token that is still usable until it actually expires.
      return NextResponse.json({ error: REFRESH_FAILED_ERROR }, { status: 401 });
    }

    handOffErpSession(renewal.response, renewal.data.token as string, userToken);

    return NextResponse.json({ token: renewal.data.token }, { status: 200 });
  } catch (error) {
    return handleLoginError(error);
  }
}
