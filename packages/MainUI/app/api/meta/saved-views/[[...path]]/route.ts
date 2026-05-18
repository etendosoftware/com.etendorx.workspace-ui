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
import type { NextRequest } from "next/server";
import { extractBearerToken } from "@/lib/auth";
import { getErpAuthHeaders } from "@/app/api/_utils/forwardConfig";

const BACKEND_BASE = `${process.env.ETENDO_CLASSIC_URL}/sws/com.etendoerp.metadata.meta/saved-views`;

async function handleRequest(
  request: NextRequest,
  params: Promise<{ path?: string[] }>,
  method: string
): Promise<Response> {
  const token = extractBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path = [] } = await params;
  const pathSuffix = path.length > 0 ? `/${path.join("/")}` : "";
  const { search } = new URL(request.url);
  const backendUrl = `${BACKEND_BASE}${pathSuffix}${search}`;

  const { cookieHeader, csrfToken } = getErpAuthHeaders(request, token);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  if (cookieHeader) headers.Cookie = cookieHeader;
  if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

  const body = method !== "GET" ? await request.text() : undefined;

  const res = await fetch(backendUrl, { method, headers, body });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: text }, { status: res.status });
  }

  if (res.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data: unknown = await res.json();
  return NextResponse.json(data);
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleRequest(request, context.params, "GET");
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleRequest(request, context.params, "POST");
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleRequest(request, context.params, "PUT");
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return handleRequest(request, context.params, "DELETE");
}
