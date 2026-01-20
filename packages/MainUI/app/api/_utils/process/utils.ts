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
import { NextResponse } from "next/server";

/**
 * Normalizes a base URL by removing trailing slashes
 * @param url - The URL to normalize
 * @returns The normalized URL without trailing slash
 */
export function normalizeBaseUrl(url: string | undefined): string {
  return url?.endsWith("/") ? url.slice(0, -1) : url || "";
}

/**
 * Handles the response from the ERP API and returns an appropriate NextResponse
 * @param response - The fetch Response object from the ERP API
 * @param errorContext - Context string for error logging
 * @returns NextResponse with the appropriate data or error
 */
export async function handleErpResponse(response: Response, errorContext: string): Promise<NextResponse> {
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${errorContext}: ${response.status} ${response.statusText}. ${errorText}`);
    return NextResponse.json({ success: false, error: errorText }, { status: response.status });
  }

  const data = await response.json();
  return NextResponse.json(data);
}

/**
 * Handles errors in API route handlers and returns an appropriate NextResponse
 * @param error - The error that occurred
 * @param errorContext - Context string for error logging
 * @returns NextResponse with error information
 */
export function handleApiError(error: unknown, errorContext: string): NextResponse {
  console.error(`${errorContext}:`, error);
  return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
}
