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

import { toast } from "sonner";
import type { TranslateFunction } from "@/hooks/types";
import type { ExecutionTransition } from "./mergeExecutions";

interface NotifyOptions {
  t: TranslateFunction;
  /** Opens the error dialog of the given execution. */
  openDetail: (executionId: string) => void;
}

/**
 * Shows one error toast per run that failed. The toast id is `<run id>`, so a run can never
 * produce the same toast twice. Completed runs are deliberately not announced (noise).
 */
export function notifyTransitions(transitions: ExecutionTransition[], { t, openDetail }: NotifyOptions): void {
  for (const { execution } of transitions) {
    const name = execution.processName || t("processMonitor.unnamedProcess");
    toast.error(
      t("processMonitor.toast.failed").replace("%0", () => name),
      {
        id: `process-monitor:${execution.id}`,
        action: { label: t("processMonitor.viewError"), onClick: () => openDetail(execution.id) },
      }
    );
  }
}
