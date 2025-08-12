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

import { delay } from "@/utils";
import { logger } from "@/utils/logger";

export async function performHealthCheck(
  url: string,
  signal: AbortSignal,
  maxAttempts: number,
  delayMs: number,
  onSuccess: () => void,
  onError: () => void
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Use Next.js proxy endpoint for health check instead of direct ERP URL
      const healthCheckUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/api/auth/login`
          : "http://localhost:3000/api/auth/login";

      const response = await fetch(healthCheckUrl, {
        method: "OPTIONS",
        signal,
        keepalive: false,
        credentials: "include",
      });

      if (response.ok && !signal.aborted) {
        onSuccess();

        break;
      }
      throw new Error(response.statusText);
    } catch (error) {
      if (signal.aborted) return;

      logger.warn(`Health check attempt ${attempt} failed:`, error);

      if (attempt === maxAttempts && !signal.aborted) {
        onError();
      }

      await delay(delayMs);
    }
  }
}

export async function performCopilotHealthCheck(baseUrl: string, token: string, signal?: AbortSignal) {
  // Use Next.js proxy endpoint for copilot instead of direct ERP URL
  const assistantsUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/copilot/assistants`
      : "http://localhost:3000/api/copilot/assistants";

  logger.info("Copilot Health Check:", {
    baseUrl, // Original ERP base URL (for reference)
    assistantsUrl, // Our proxy URL
    hasToken: !!token,
    tokenLength: token?.length || 0,
  });

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Pass the user token to our proxy
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(assistantsUrl, {
      method: "GET",
      headers,
      signal,
      credentials: "include",
    });

    logger.info("Copilot Health Check Response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (response.ok) {
      const data = await response.text();
      logger.info("Copilot Health Check Data:", data.substring(0, 200));
      return { success: true, data, status: response.status };
    }
    const errorText = await response.text();
    logger.error("Copilot Health Check Failed:", errorText.substring(0, 200));
    return { success: false, error: errorText, status: response.status };
  } catch (error) {
    logger.error("Copilot Health Check Error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
