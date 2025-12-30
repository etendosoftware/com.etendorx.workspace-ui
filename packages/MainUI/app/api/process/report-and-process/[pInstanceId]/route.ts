/*
 *************************************************************************
 * The contents of this file are subject to the Etendo License
 * (the "License"), you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
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
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";

function normalizeBaseUrl(url: string | undefined): string {
  return url?.endsWith("/") ? url.slice(0, -1) : url || "";
}

export interface ProcessStatusResponse {
  pInstanceId: string;
  result: number; // 1 = Success, 0 = Error
  errorMsg: string;
  isProcessing: boolean;
}

/**
 * Check the status of a running process instance.
 * Poll this endpoint until isProcessing is false.
 *
 * GET /api/process/report-and-process/{pInstanceId}?processId=xxx
 * Returns: { pInstanceId, result, errorMsg, isProcessing }
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ pInstanceId: string }> }) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    const { pInstanceId } = await params;

    const baseUrl = normalizeBaseUrl(process.env.ETENDO_CLASSIC_URL);
    const erpUrl = `${baseUrl}/sws/com.etendoerp.metadata.meta/process/status/${pInstanceId}`;

    const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    };
    if (cookieHeader) headers.Cookie = cookieHeader;
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    console.log("headers: ", headers);

    // Backend requires processId in body even for GET request
    const response = await fetch(erpUrl, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Process status check failed: ${response.status} ${response.statusText}. ${errorText}`);
      return NextResponse.json({ success: false, error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Process status check error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
