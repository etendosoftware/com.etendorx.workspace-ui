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

import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  type ActionDispatchContext,
  buildReportActionUrl,
  type ProcessActionMessage,
  REPORT_ACTION_MODES,
} from "@/components/ProcessModal/utils/responseActionDispatcher";
import { dialogScriptApi } from "@/utils/processes/definition/dialogs";
import { messageBar } from "@/utils/processes/definition/messageBarStore";
import {
  browseReport as fetchAndBrowseReport,
  downloadReport as fetchAndDownloadReport,
} from "@/utils/processes/definition/reportActions";
import {
  clearActionDispatchContext,
  setActionDispatchContext,
} from "@/utils/processes/definition/actionDispatcherStore";
import { logger } from "@/utils/logger";

/** Live modal handles the action handlers delegate to. */
export interface UseActionDispatchContextParams {
  /**
   * Refetches the launching tab's grid (classic `refreshGrid`). Must be a
   * targeted datasource refetch, NOT the post-execution success handler:
   * the latter closes/reloads the modal and, when called from `onLoad`,
   * reopens it and re-runs `onLoad` in an infinite loop.
   */
  refreshParentGrid: () => void;
  /** Bumps the modal grid refresh key (classic `refreshGridParameter`). */
  refreshModalGrid: () => void;
  /** Navigates to a tab/record (classic `openDirectTab`). */
  navigateToTab: (tabId: string, recordId: string) => void;
  /** Auth token used to fetch report files. */
  token: string;
}

/** Maps a classic message type to the matching sonner toast function. */
const TOAST_BY_TYPE: Record<string, (message: string) => void> = {
  error: (m) => toast.error(m),
  warning: (m) => toast.warning(m),
  success: (m) => toast.success(m),
  info: (m) => toast.info(m),
};

function showViewToast(payload: ProcessActionMessage): void {
  const text = payload.msgText ?? payload.msgTitle ?? "";
  if (!text) return;
  const show = TOAST_BY_TYPE[payload.msgType ?? "info"] ?? ((m: string) => toast.info(m));
  show(text);
}

/**
 * Registers the modal's action-dispatch handlers in the singleton store while
 * the modal is mounted, so migrated scripts (`OB.Utilities.Action.executeJSON`)
 * and the onProcess return path turn each classic action type into a side
 * effect. Cleared on unmount so a closed modal never receives stray actions.
 */
export function useActionDispatchContext({
  refreshParentGrid,
  refreshModalGrid,
  navigateToTab,
  token,
}: UseActionDispatchContextParams): void {
  const ctx = useMemo<ActionDispatchContext>(
    () => ({
      showMessageInProcessView: (payload) => {
        messageBar.setMessage(payload.msgType ?? "info", payload.msgTitle ?? null, payload.msgText ?? "");
      },
      showMessageInView: showViewToast,
      openDirectTab: (payload) => {
        if (payload.tabId) navigateToTab(payload.tabId, payload.recordId ?? "");
      },
      refreshParentGrid: () => refreshParentGrid(),
      refreshGridParameter: () => refreshModalGrid(),
      setSelectorValueFromRecord: () => {
        // The standalone process modal has no caller selector field; this
        // becomes effective once a process can be launched from a selector.
        logger.warn("[ProcessModal] setSelectorValueFromRecord has no caller field in this context");
      },
      say: (message) => {
        dialogScriptApi.say(message);
      },
      browseReport: (payload) => {
        fetchAndBrowseReport(buildReportActionUrl(payload, REPORT_ACTION_MODES.BROWSE), token);
      },
      downloadReport: (payload) => {
        fetchAndDownloadReport(
          buildReportActionUrl(payload, REPORT_ACTION_MODES.DOWNLOAD),
          token,
          payload.fileName ?? "report"
        );
      },
    }),
    [refreshParentGrid, refreshModalGrid, navigateToTab, token]
  );

  useEffect(() => {
    setActionDispatchContext(ctx);
    return () => clearActionDispatchContext(ctx);
  }, [ctx]);
}
