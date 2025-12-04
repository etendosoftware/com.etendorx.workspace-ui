"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { logger } from "@/utils/logger";

export interface ExecuteProcessResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: executeProcess
 *
 * Executes an Etendo process on the server and performs cache invalidation.
 *
 * Notes:
 * - This function runs only on the server.
 * - In production, the Authorization should be derived from the user session (e.g., iron-session/JWT).
 * - For now, this action expects the API layer to validate the request and forward auth accordingly.
 */
export async function executeProcess(
  processId: string,
  parameters: Record<string, any>,
  token: string,
  windowId?: string,
  reportId?: string,
  actionHandler?: string
): Promise<ExecuteProcessResult> {
  try {
    if (!token) {
      logger.error?.("executeProcess: No authentication token provided");
      return { success: false, error: "Authentication required" };
    }

    // Build URL with proper query parameters to match Classic Etendo behavior
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const queryParams = new URLSearchParams();
    queryParams.set("processId", processId);

    if (windowId) {
      queryParams.set("windowId", windowId);
    }

    if (reportId !== undefined) {
      queryParams.set("reportId", reportId);
    }

    if (actionHandler) {
      queryParams.set("_action", actionHandler);
    }

    const apiUrl = `${baseUrl}/api/erp?${queryParams.toString()}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(parameters ?? {}),
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Execution failed");
      logger.error?.(`executeProcess(${processId}) failed: ${response.status} ${response.statusText}. ${errorText}`);
      return { success: false, error: errorText || "Process execution failed" };
    }

    let result: any = null;
    try {
      result = await response.json();
    } catch {
      // Non-JSON responses are still treated as success but without structured data
      result = null;
    }

    // Invalidate caches that may be affected by process execution
    try {
      revalidateTag("datasource", "default");
      revalidatePath("/window");
    } catch (e) {
      logger.warn?.("Cache revalidation failed after executeProcess", e);
    }

    logger.info?.(`Process ${processId} executed successfully via Server Action.`);
    return { success: true, data: result };
  } catch (error: any) {
    logger.error?.(`Server Action executeProcess(${processId}) error`, error);
    return { success: false, error: "An unexpected server error occurred" };
  }
}
