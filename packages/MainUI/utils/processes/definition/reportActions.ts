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

/**
 * Browser-side helpers backing the report response actions
 * (`OBUIAPP_browseReport` / `OBUIAPP_downloadReport`). The classic UI relies on
 * cookie auth and a hidden-form POST; the new UI authenticates with a Bearer
 * token, so the report is fetched with the token, turned into a Blob and then
 * either opened in a new tab or saved through an anchor download.
 */

import { logger } from "@/utils/logger";

/** A fetched report file ready to be opened or downloaded. */
export interface ReportBlob {
  blob: Blob;
  /** Suggested file name parsed from the response `Content-Disposition`, if any. */
  fileName?: string;
}

const FILE_NAME_REGEX = /filename="?([^"]+)"?/i;

/** Extracts a file name from a `Content-Disposition` header, if present. */
function parseFileName(disposition: string | null): string | undefined {
  if (!disposition) return undefined;
  const match = disposition.match(FILE_NAME_REGEX);
  return match?.[1];
}

/**
 * Fetches a report URL with Bearer auth and returns its Blob. Throws on a
 * non-OK response so the caller can surface the failure.
 */
export async function fetchReportBlob(url: string, token: string): Promise<ReportBlob> {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error(`Report request failed with status ${response.status}`);
  }
  const blob = await response.blob();
  return { blob, fileName: parseFileName(response.headers.get("Content-Disposition")) };
}

/** Opens a Blob in a new browser tab, revoking the temporary object URL after. */
export function openBlobInNewTab(blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob);
  window.open(objectUrl, "_blank", "noopener,noreferrer");
  // The new tab keeps its own reference; revoke ours on the next tick.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

/** Triggers a file download for a Blob via a transient anchor element. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

/** Fetches and opens a report; logs and swallows failures (best-effort UX). */
export async function browseReport(url: string, token: string): Promise<void> {
  try {
    const { blob } = await fetchReportBlob(url, token);
    openBlobInNewTab(blob);
  } catch (error) {
    logger.warn("[ProcessModal] browseReport failed", error);
  }
}

/** Fetches and downloads a report; logs and swallows failures (best-effort UX). */
export async function downloadReport(url: string, token: string, fileName: string): Promise<void> {
  try {
    const { blob, fileName: headerName } = await fetchReportBlob(url, token);
    downloadBlob(blob, fileName || headerName || "report");
  } catch (error) {
    logger.warn("[ProcessModal] downloadReport failed", error);
  }
}
