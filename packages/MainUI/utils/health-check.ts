import { delay } from "@/utils";
import { logger } from "@/utils/logger";
import { API_LOGIN_URL } from "@workspaceui/api-client/src/api/constants";

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
      const response = await fetch(url + API_LOGIN_URL, {
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
  const assistantsUrl = `${baseUrl}assistants`;

  logger.info("Copilot Health Check:", {
    baseUrl,
    assistantsUrl,
    hasToken: !!token,
    tokenLength: token?.length || 0,
  });

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (process.env.NODE_ENV === "production") {
      headers.Authorization = `Bearer ${token}`;
    } else {
      headers.Authorization = `Basic ${btoa("admin:admin")}`;
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
