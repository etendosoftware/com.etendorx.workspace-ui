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
  parameters: Record<string, any>
): Promise<ExecuteProcessResult> {
  try {
    // Prefer calling our internal ERP proxy to keep concerns centralized.
    // The proxy handles kernel forwards and query composition.
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/erp?processId=${encodeURIComponent(processId)}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization header should be added by the proxy layer or derived via session in a future iteration.
      },
      body: JSON.stringify(parameters ?? {}),
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
      revalidateTag("datasource");
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

