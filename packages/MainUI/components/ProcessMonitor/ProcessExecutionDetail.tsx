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

"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import Modal from "@workspaceui/componentlibrary/src/components/BasicModal";
import {
  fetchProcessMonitorDetail,
  type ProcessExecutionDetail as ExecutionDetail,
} from "@workspaceui/api-client/src/api/processMonitor";
import { useTranslation } from "@/hooks/useTranslation";
import { useProcessMonitorStore } from "@/stores/processMonitorStore";
import { formatTimestamp } from "@/utils/processMonitor/format";

type DetailState = { kind: "loading" } | { kind: "error" } | { kind: "ready"; detail: ExecutionDetail };

const Field = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="flex flex-col">
    <dt className="text-xs text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900 break-words">{value || "—"}</dd>
  </div>
);

/**
 * Dialog with the full error log of a failed execution, fetched from
 * `GET /meta/process-monitor/{runId}`. Mounted by `ProcessMonitorButton`; opened from the popover
 * or from the failure toast through `useProcessMonitorStore.openDetail`. Text is rendered as plain text.
 */
const ProcessExecutionDetail: React.FC = () => {
  const { t } = useTranslation();
  const detailId = useProcessMonitorStore((s) => s.detailId);
  const closeDetail = useProcessMonitorStore((s) => s.closeDetail);
  const name = useProcessMonitorStore((s) => (s.detailId ? s.executions[s.detailId]?.processName : null));
  const [state, setState] = useState<DetailState>({ kind: "loading" });

  useEffect(() => {
    if (!detailId) {
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });
    fetchProcessMonitorDetail(detailId)
      .then((detail) => {
        if (!cancelled) setState({ kind: "ready", detail });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [detailId]);

  if (!detailId) {
    return null;
  }

  const detail = state.kind === "ready" ? state.detail : undefined;
  const message = detail?.errorMessage || detail?.log;

  return (
    <Modal
      open
      showHeader
      tittleHeader={detail?.processName || name || t("processMonitor.unnamedProcess")}
      width="40rem"
      onClose={closeDetail}
      onCancel={closeDetail}
      data-testid="process-monitor-dialog">
      <Box className="flex flex-col gap-3 p-4 max-w-full" data-testid="process-monitor-detail">
        {state.kind === "loading" && (
          <div className="flex justify-center p-4">
            <CircularProgress size={24} />
          </div>
        )}
        {state.kind === "error" && (
          <p role="alert" className="text-sm text-red-700">
            {t("processMonitor.detailError")}
          </p>
        )}
        {detail && (
          <>
            <dl className="grid grid-cols-3 gap-3">
              <Field label={t("processMonitor.started")} value={formatTimestamp(detail.startTime)} />
              <Field label={t("processMonitor.ended")} value={formatTimestamp(detail.endTime)} />
              <Field label={t("processMonitor.duration")} value={detail.duration} />
            </dl>
            <section>
              <h4 className="text-sm font-semibold text-red-700 mb-1">{t("processMonitor.errorLog")}</h4>
              {message ? (
                <pre
                  className="text-xs whitespace-pre-wrap break-words bg-red-50 border border-red-200 rounded p-2 max-h-80 overflow-auto"
                  data-testid="process-monitor-error-message">
                  {message}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">{t("processMonitor.noLog")}</p>
              )}
            </section>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default ProcessExecutionDetail;
