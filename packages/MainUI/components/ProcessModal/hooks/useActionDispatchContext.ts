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

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
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
  delegateActionDispatchContext,
  setActionDispatchContext,
} from "@/utils/processes/definition/actionDispatcherStore";
import type { CallerField } from "@/utils/processes/definition/scriptProxies";
import {
  buildOpenUrlFallbackAction,
  openExternalWindow,
  resolveErpHostedUrl,
} from "@/utils/processes/definition/openUrl";
import { useRuntimeConfig } from "@/contexts/RuntimeConfigContext";
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
  /** Closes the process modal (used by `openUrl` with `closeModal: true`). */
  closeModal: () => void;
  /** Auth token used to fetch report files. */
  token: string;
  /** The selector that launched this process, if any (classic `callerField`). */
  callerField?: CallerField;
  /** Whether the modal is open; only an open modal receives actions. Defaults to `true`. */
  active?: boolean;
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
 * the modal is open, so migrated scripts (`OB.Utilities.Action.executeJSON`)
 * and the onProcess return path turn each classic action type into a side
 * effect. Cleared on close and unmount so a closed modal never receives stray actions.
 */
export function useActionDispatchContext({
  refreshParentGrid,
  refreshModalGrid,
  navigateToTab,
  closeModal,
  token,
  callerField,
  active = true,
}: UseActionDispatchContextParams): void {
  const { t } = useTranslation();
  const { config } = useRuntimeConfig();
  const classicHost = config?.etendoClassicHost ?? "";

  const ctx = useMemo<ActionDispatchContext>(() => {
    // A report file that cannot be opened/downloaded must not fail silently.
    const showReportFileError = () => messageBar.setMessage("error", null, t("process.reportFileFailed"));
    return {
      showMessageInProcessView: (payload) => {
        messageBar.setMessage(payload.msgType ?? "info", payload.msgTitle ?? null, payload.msgText ?? "");
      },
      showMessageInView: showViewToast,
      openDirectTab: (payload) => {
        if (payload.tabId) navigateToTab(payload.tabId, payload.recordId ?? "");
      },
      refreshParentGrid: () => refreshParentGrid(),
      refreshGridParameter: () => refreshModalGrid(),
      setSelectorValueFromRecord: (payload) => {
        // Only a process launched from a selector (its "+") has a field to write into.
        if (callerField?.setValueFromRecord && payload.record) {
          callerField.setValueFromRecord(payload.record);
          return;
        }
        logger.warn("[ProcessModal] setSelectorValueFromRecord has no caller field in this context");
      },
      say: (message) => {
        dialogScriptApi.say(message);
      },
      browseReport: (payload) => {
        fetchAndBrowseReport(buildReportActionUrl(payload, REPORT_ACTION_MODES.BROWSE), token, showReportFileError);
      },
      downloadReport: (payload) => {
        fetchAndDownloadReport(
          buildReportActionUrl(payload, REPORT_ACTION_MODES.DOWNLOAD),
          token,
          payload.fileName ?? "report",
          showReportFileError
        );
      },
      openUrl: (payload) => {
        // An `erpHosted` payload carries an ERP path, not a ready URL: expand it
        // against the Classic host here, where the runtime config and the token
        // live. Every other payload passes through untouched.
        const resolved = { ...payload, url: resolveErpHostedUrl(payload, { classicHost, token }) };
        // The window is opened after an await, so the browser may treat it as a
        // non-gesture popup and block it. Offer a direct click instead of
        // silently losing the hand-off.
        const opened = openExternalWindow(resolved);
        if (!opened) {
          messageBar.setMessage("warning", null, t("process.popupBlocked"), [
            buildOpenUrlFallbackAction(resolved, t("process.openLink")),
          ]);
        }
        if (payload.refreshRecord) refreshParentGrid();
        // Keep the modal open when blocked: closing it would unmount the banner
        // that carries the only remaining way to reach the URL.
        if (payload.closeModal && opened) closeModal();
      },
    };
  }, [refreshParentGrid, refreshModalGrid, navigateToTab, closeModal, token, t, classicHost, callerField]);

  // Registered once per opening, delegating to the latest handlers: the stack follows the order
  // the modals were opened in, and rebuilding the handlers does not move this modal above a
  // nested one opened on top of it.
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  useEffect(() => {
    if (!active) return;
    const registered = delegateActionDispatchContext(() => ctxRef.current);
    setActionDispatchContext(registered);
    return () => clearActionDispatchContext(registered);
  }, [active]);
}
