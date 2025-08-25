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

import { type NextRequest } from "next/server";
import { getDebugLogs } from "../../_utils/debugLogger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  // Only available in development mode
  if (process.env.NODE_ENV !== "development") {
    return new Response("Debug endpoint not available in production", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      try {
        const logs = getDebugLogs();
        const data = JSON.stringify(logs);
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      } catch (error) {
        console.error("SSE initial data error:", error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify([])}\n\n`));
      }

      // Set up polling for updates
      const interval = setInterval(() => {
        try {
          const logs = getDebugLogs();
          const data = JSON.stringify(logs);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        } catch (error) {
          console.error("SSE update error:", error);
          controller.error(error);
        }
      }, 1000);

      // Cleanup on connection close
      const cleanup = () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (error) {
          // Controller might already be closed
          console.debug("Controller cleanup error:", error);
        }
      };

      // Handle client disconnection
      request.signal.addEventListener("abort", cleanup);

      // Also set a timeout to prevent long-running connections
      setTimeout(() => {
        console.debug("SSE connection timeout reached");
        cleanup();
      }, 30 * 60 * 1000); // 30 minutes timeout
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  });
}