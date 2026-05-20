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
 * All portions are Copyright © 2021-2026 FUTIT SERVICES, S.L
 * All Rights Reserved.
 * Contributor(s): Futit Services S.L.
 *************************************************************************
 */
"use client";
import { useCallback, useEffect, useRef, useState, createElement } from "react";
import { toast } from "sonner";
import type { BackgroundProcessItem } from "@workspaceui/api-client/src/api/types";
import { ToastContent } from "@/components/ToastContent";

const ACTIVE_INTERVAL_MS = 10_000;
const IDLE_INTERVAL_MS = 30_000;

export function useBackgroundProcessMonitor() {
  const [items, setItems] = useState<BackgroundProcessItem[]>([]);
  const [loading, setLoading] = useState(false);
  const prevStatusRef = useRef<Map<string, string>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const fetchProcesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/process/monitor?status=ALL&hours=24");
      if (!res.ok || !isMountedRef.current) return;

      const data: { items?: BackgroundProcessItem[] } = await res.json();
      const newItems = data.items ?? [];

      if (!isMountedRef.current) return;
      setItems(newItems);

      for (const item of newItems) {
        const prev = prevStatusRef.current.get(item.pInstanceId);
        if (prev === "RUNNING" && item.status === "COMPLETED") {
          toast.success(`${item.processName} completed successfully`);
        } else if (prev === "RUNNING" && item.status === "FAILED") {
          toast.error(`${item.processName} failed`, {
            description: createElement(ToastContent, {
              message: item.errorMsg ?? "Process finished with errors",
            }),
            duration: Number.POSITIVE_INFINITY,
          });
        }
      }

      prevStatusRef.current = new Map(newItems.map((i) => [i.pInstanceId, i.status]));
    } catch {
      // silently ignore network errors — monitor is non-critical
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  const scheduleNext = useCallback(() => {
    if (!isMountedRef.current) return;
    const hasRunning = Array.from(prevStatusRef.current.values()).some((s) => s === "RUNNING");
    const delay = hasRunning ? ACTIVE_INTERVAL_MS : IDLE_INTERVAL_MS;
    timerRef.current = setTimeout(async () => {
      await fetchProcesses();
      scheduleNext();
    }, delay);
  }, [fetchProcesses]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchProcesses().then(scheduleNext);
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchProcesses, scheduleNext]);

  const refresh = useCallback(() => fetchProcesses(), [fetchProcesses]);

  const runningCount = items.filter((i) => i.status === "RUNNING").length;
  const failedCount = items.filter((i) => i.status === "FAILED").length;

  return { items, loading, runningCount, failedCount, refresh };
}
