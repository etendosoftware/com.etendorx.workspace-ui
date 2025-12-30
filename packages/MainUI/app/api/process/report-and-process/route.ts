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

export interface ReportProcessRequest {
  processId: string;
  parameters: Record<string, unknown>;
}

export interface ReportProcessResponse {
  pInstanceId: string;
  status: string;
}

/**
 * Execute a report-and-process type process.
 *
 * POST /api/process/report-and-process
 * Body: { processId: string, parameters: Record<string, unknown> }
 * Returns: { pInstanceId: string, status: "STARTED" }
 */
export async function POST(request: NextRequest) {
  try {
    const userToken = extractBearerToken(request);
    if (!userToken) {
      return NextResponse.json({ error: "Unauthorized - Missing Bearer token" }, { status: 401 });
    }

    const body: ReportProcessRequest = await request.json();
    const baseUrl = normalizeBaseUrl(process.env.ETENDO_CLASSIC_URL);
    const erpUrl = `${baseUrl}/sws/com.etendoerp.metadata.meta/process`;

    const { cookieHeader, csrfToken } = getErpAuthHeaders(request, userToken);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${userToken}`,
    };
    if (cookieHeader) headers.Cookie = cookieHeader;
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const response = await fetch(erpUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Report process execution failed: ${response.status} ${response.statusText}. ${errorText}`);
      return NextResponse.json({ success: false, error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Report process execution error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
